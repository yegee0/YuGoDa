package yugoda.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import yugoda.model.Bag;
import yugoda.model.Order;
import yugoda.repository.BagRepository;
import yugoda.repository.OrderRepository;

import java.io.InputStream;
import java.util.*;

/**
 * Loads the trained two-tower ONNX model + precomputed bag embeddings + vocab,
 * and produces top-K bag recommendations for a given user.
 *
 * <p>The user tower runs on each request (~5-15ms CPU); bag embeddings are
 * precomputed offline and held in memory. Cosine similarity is computed
 * directly via dot product since both vectors are L2-normalized.
 *
 * <p><b>The content-based scorer is the PRIMARY path for real users, not ONNX.</b>
 * The trained vocab is fully synthetic ({@code synth_u_*} / {@code synth_b_*});
 * real Firebase users and DB-seeded bags are never in it, so ONNX inference would
 * emit a constant zero user embedding (identical, never-changing recs). Those
 * users are routed to {@link #contentBasedRecommend} — a recency-weighted content
 * scorer. The ONNX branch only serves in-vocab (synthetic/eval) users.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);
    private static final String MODEL_PATH = "models/user_tower.onnx";
    private static final String BAG_EMB_PATH = "models/bag_embeddings.json";
    private static final String VOCAB_PATH = "models/vocab.json";

    // Content-based scorer tuning (primary path for real users — see recommend()).
    private static final double RECENCY_DECAY = 0.75;         // r-th newest order weighs 0.75^r (within-category ranking)
    private static final double DIETARY_WEIGHT = 2.0;
    private static final double PRICE_WEIGHT = 1.0;
    private static final double RATING_WEIGHT = 0.5;
    private static final int MAX_PREF_CATEGORIES = 3;         // at most this many recent categories share the row
    private static final int TOP_CATEGORY_SLOTS = 2;          // most-recent category gets two cards; others one

    private final OrderRepository orderRepository;
    private final BagRepository bagRepository;

    private OrtEnvironment env;
    private OrtSession userTowerSession;

    private float[][] bagEmbeddings;
    private String[] bagIdsByIdx;
    private Map<String, Integer> bagIdToIdx;
    private Map<String, Integer> userIdToIdx;
    private int historyLen;
    private int embedDim;

    /** ORT session is not thread-safe — guard inference calls. */
    private final Object inferenceLock = new Object();

    @PostConstruct
    public void init() {
        try {
            log.info("[RECOMMENDATION] Loading model artifacts from classpath...");
            env = OrtEnvironment.getEnvironment();

            // ONNX session
            try (InputStream in = new ClassPathResource(MODEL_PATH).getInputStream()) {
                byte[] modelBytes = in.readAllBytes();
                userTowerSession = env.createSession(modelBytes, new OrtSession.SessionOptions());
            }

            ObjectMapper mapper = new ObjectMapper();

            // Bag embeddings
            try (InputStream in = new ClassPathResource(BAG_EMB_PATH).getInputStream()) {
                Map<?, ?> data = mapper.readValue(in, Map.class);
                embedDim = ((Number) data.get("dim")).intValue();
                @SuppressWarnings("unchecked")
                List<String> bagIds = (List<String>) data.get("bag_ids");
                @SuppressWarnings("unchecked")
                List<List<Number>> embs = (List<List<Number>>) data.get("embeddings");
                int n = bagIds.size();
                bagIdsByIdx = bagIds.toArray(new String[0]);
                bagEmbeddings = new float[n][embedDim];
                for (int i = 0; i < n; i++) {
                    List<Number> row = embs.get(i);
                    for (int j = 0; j < embedDim; j++) {
                        bagEmbeddings[i][j] = row.get(j).floatValue();
                    }
                }
            }

            // Vocab
            try (InputStream in = new ClassPathResource(VOCAB_PATH).getInputStream()) {
                Map<?, ?> data = mapper.readValue(in, Map.class);
                @SuppressWarnings("unchecked")
                Map<String, Integer> u2i = (Map<String, Integer>) data.get("user2idx");
                userIdToIdx = u2i;
                @SuppressWarnings("unchecked")
                Map<String, Integer> b2i = (Map<String, Integer>) data.get("bag2idx");
                bagIdToIdx = b2i;
                @SuppressWarnings("unchecked")
                Map<String, Object> cfg = (Map<String, Object>) data.get("config");
                historyLen = ((Number) cfg.get("history_len")).intValue();
            }

            log.info("[RECOMMENDATION] Loaded: {} bags, embed_dim={}, history_len={}, {} users in vocab",
                    bagEmbeddings.length, embedDim, historyLen, userIdToIdx.size());
        } catch (Exception e) {
            log.error("[RECOMMENDATION] Failed to load model artifacts; recommendation endpoint will return errors", e);
        }
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (userTowerSession != null) userTowerSession.close();
        } catch (OrtException e) {
            log.warn("Error closing ONNX session", e);
        }
    }

    public boolean isReady() {
        return userTowerSession != null && bagEmbeddings != null && userIdToIdx != null;
    }

    /**
     * Recommend top-K bags for a user.
     *
     * @param userId          internal user UID (Firebase or synth_u_*)
     * @param topK            how many recommendations to return
     * @param excludeOrdered  if true, filter out bags the user has already ordered
     * @return list of (bag, score) sorted descending by score; smaller than topK if not enough valid bags
     */
    public List<ScoredBag> recommend(String userId, int topK, boolean excludeOrdered) throws OrtException {
        if (!isReady()) throw new IllegalStateException("Recommendation model not loaded");

        // 1. Preference signal: delivered orders only (newest first). An order
        //    counts once it has been physically delivered (verification code entered).
        List<Order> userOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Order> signalOrders = new ArrayList<>();
        List<Integer> historyIdx = new ArrayList<>(historyLen);
        Set<String> orderedBagIds = new HashSet<>();
        for (Order o : userOrders) {
            if (!isSignalOrder(o)) continue;
            signalOrders.add(o);
            orderedBagIds.add(o.getBagId());
            Integer idx = bagIdToIdx.get(o.getBagId());
            if (idx != null && historyIdx.size() < historyLen) {
                historyIdx.add(idx);
            }
        }

        // Real (Firebase) users are never in the synth-trained vocab, and DB-seeded
        // bags aren't either, so ONNX would emit a constant zero user embedding
        // (identical, never-changing recs). Route them to the content-based scorer,
        // which is the PRIMARY path in practice. The ONNX branch below only serves
        // in-vocab (synthetic/eval) users.
        Integer userIdxBoxed = userIdToIdx.get(userId);
        if (userIdxBoxed == null && historyIdx.isEmpty()) {
            return contentBasedRecommend(signalOrders, topK, orderedBagIds, excludeOrdered);
        }

        // 2. ONNX inputs (history padded; mask zeroes out padding slots)
        long[] history = new long[historyLen];
        float[] historyMask = new float[historyLen];
        for (int i = 0; i < historyIdx.size(); i++) {
            history[i] = historyIdx.get(i);
            historyMask[i] = 1.0f;
        }
        long nHistory = historyIdx.size();
        long userIdx = userIdxBoxed != null ? userIdxBoxed.longValue() : -1L;  // -1 → +1 = 0 (cold-start padding)

        // 3. Inference
        float[] userEmb;
        synchronized (inferenceLock) {
            try (
                OnnxTensor userIdxT = OnnxTensor.createTensor(env, new long[]{userIdx});
                OnnxTensor historyT = OnnxTensor.createTensor(env, new long[][]{history});
                OnnxTensor maskT = OnnxTensor.createTensor(env, new float[][]{historyMask});
                OnnxTensor nHistT = OnnxTensor.createTensor(env, new long[]{nHistory});
                OrtSession.Result result = userTowerSession.run(Map.of(
                        "user_idx", userIdxT,
                        "history", historyT,
                        "history_mask", maskT,
                        "n_history", nHistT
                ))
            ) {
                float[][] out = (float[][]) result.get(0).getValue();
                userEmb = out[0];
            }
        }

        // 4. Cosine similarity = dot product (both L2-normalized)
        int n = bagEmbeddings.length;
        float[] scores = new float[n];
        for (int i = 0; i < n; i++) {
            float s = 0;
            float[] bag = bagEmbeddings[i];
            for (int j = 0; j < embedDim; j++) {
                s += userEmb[j] * bag[j];
            }
            scores[i] = s;
        }

        // 5. Top-K via index sort (filter ordered bags + skip missing entities)
        Integer[] idxs = new Integer[n];
        for (int i = 0; i < n; i++) idxs[i] = i;
        Arrays.sort(idxs, (a, b) -> Float.compare(scores[b], scores[a]));

        List<ScoredBag> result = new ArrayList<>(topK);
        for (int idx : idxs) {
            String bagId = bagIdsByIdx[idx];
            if (excludeOrdered && orderedBagIds.contains(bagId)) continue;
            Bag bag = bagRepository.findById(bagId).orElse(null);
            if (bag == null) continue;  // bag deleted from DB after training
            result.add(new ScoredBag(bag, scores[idx]));
            if (result.size() >= topK) break;
        }
        return result;
    }

    /** Only delivered orders count as a preference signal — an order reflects a
     *  realised purchase once it has been physically delivered (delivery verification
     *  code entered). Pending/confirmed/preparing/.../cancelled orders are ignored. */
    private static boolean isSignalOrder(Order o) {
        return "delivered".equals(o.getStatus());
    }

    /**
     * Content-based recommender — the PRIMARY path for real users (see {@link #recommend}).
     *
     * <p>Instead of letting one category flood the row, it builds a <b>recency-ranked
     * blend</b>: the most-recent category gets {@value #TOP_CATEGORY_SLOTS} cards, each
     * further recent category one card (up to {@value #MAX_PREF_CATEGORIES} distinct
     * categories), and any leftover cards become diverse "discovery" picks. On the 4-card UI:
     * <ul>
     *   <li>1 ordered category   → 2 of it + 2 discovery</li>
     *   <li>2 ordered categories → 2 newest + 1 older + 1 discovery</li>
     *   <li>3 ordered categories → 2 newest + 1 + 1 (all three stay visible)</li>
     * </ul>
     * A 4th, different category pushes out the least-recently-ordered one; re-ordering a
     * category moves it back to the front. So the row tracks recent taste while older
     * categories fade gradually instead of vanishing on the next order.
     *
     * <p>Within a category's cards (category fixed there), bags rank by dietary fit, price
     * proximity to the recency-weighted average, rating, and a deterministic per-bag jitter.
     * Brand-new users (no history) get a pure diverse discovery row.
     *
     * @param signalOrdersNewestFirst delivered orders, newest first
     */
    private List<ScoredBag> contentBasedRecommend(List<Order> signalOrdersNewestFirst, int topK,
                                                  Set<String> orderedBagIds, boolean excludeOrdered) {
        // Step 1: recency-ranked categories + recency-weighted dietary/price preference.
        // Distinct categories in order of first appearance (newest→oldest) form the recency
        // ranking; a re-ordered category jumps back to the front.
        List<String> distinctBagIds = signalOrdersNewestFirst.stream()
                .map(Order::getBagId).distinct().toList();
        Map<String, Bag> bagById = new HashMap<>();
        if (!distinctBagIds.isEmpty()) {
            for (Bag b : bagRepository.findAllById(distinctBagIds)) bagById.put(b.getId(), b);
        }

        List<String> recencyCats = new ArrayList<>();   // most-recent category first
        Map<String, Double> dietaryW = new HashMap<>();
        double totalDietW = 0.0, priceWSum = 0.0, priceW = 0.0;
        int r = 0;
        for (Order o : signalOrdersNewestFirst) {
            Bag b = bagById.get(o.getBagId());
            if (b == null) continue;  // bag deleted since the order
            double w = Math.pow(RECENCY_DECAY, r++);
            if (b.getCategory() != null && !recencyCats.contains(b.getCategory())) {
                recencyCats.add(b.getCategory());
            }
            if (b.getDietaryType() != null) { dietaryW.merge(b.getDietaryType(), w, Double::sum); totalDietW += w; }
            if (b.getPrice() != null) { priceWSum += w * b.getPrice(); priceW += w; }
        }
        double avgPrice = (priceW > 0) ? (priceWSum / priceW) : 100.0;
        final double dietNorm = totalDietW;

        // Step 2: recency-priority slot allocation. Most-recent category → TOP_CATEGORY_SLOTS
        // cards, each further category → 1, capped at MAX_PREF_CATEGORIES; the rest discovery.
        LinkedHashMap<String, Integer> catSlots = new LinkedHashMap<>();
        int used = 0;
        for (int i = 0; i < recencyCats.size() && i < MAX_PREF_CATEGORIES && used < topK; i++) {
            int give = Math.min(i == 0 ? TOP_CATEGORY_SLOTS : 1, topK - used);
            catSlots.put(recencyCats.get(i), give);
            used += give;
        }

        // Per-bag affinity for ranking *within* a slot group, plus a deterministic jitter
        // seeded by the latest order (stable tie-break, independent of DB row order).
        final long seed = signalOrdersNewestFirst.isEmpty() ? 0L
                : signalOrdersNewestFirst.get(0).getId().hashCode();
        java.util.function.ToDoubleFunction<Bag> affinity = b -> {
            double dietMatch = (dietNorm > 0 && b.getDietaryType() != null)
                    ? dietaryW.getOrDefault(b.getDietaryType(), 0.0) / dietNorm : 0.0;
            double priceMatch = (b.getPrice() != null)
                    ? 1.0 / (1.0 + Math.abs(b.getPrice() - avgPrice) / 50.0) : 0.5;
            double ratingScore = (b.getRating() != null)
                    ? Math.max(0.0, (b.getRating() - 3.0) / 2.0) : 0.0;
            double jitter = ((seed ^ b.getId().hashCode()) & 0xffffL) / 65535.0 * 0.01;
            return dietMatch * DIETARY_WEIGHT + priceMatch * PRICE_WEIGHT + ratingScore * RATING_WEIGHT + jitter;
        };

        // Step 3: candidate pool — available, not-already-ordered bags, grouped by category.
        Map<String, List<Bag>> byCategory = new HashMap<>();
        List<Bag> pool = new ArrayList<>();
        for (Bag b : bagRepository.findAll()) {
            if (b.getAvailable() == null || b.getAvailable() <= 0) continue;
            if (excludeOrdered && orderedBagIds.contains(b.getId())) continue;
            pool.add(b);
            if (b.getCategory() != null) {
                byCategory.computeIfAbsent(b.getCategory(), k -> new ArrayList<>()).add(b);
            }
        }
        if (pool.isEmpty()) return List.of();

        // Step 4: fill category slots (recency order first), then diverse discovery slots.
        List<ScoredBag> picks = new ArrayList<>(topK);
        Set<String> chosen = new HashSet<>();
        Set<String> shownCategories = new HashSet<>();

        for (Map.Entry<String, Integer> e : catSlots.entrySet()) {
            byCategory.getOrDefault(e.getKey(), List.of()).stream()
                    .filter(b -> !chosen.contains(b.getId()))
                    .sorted(Comparator.comparingDouble(affinity).reversed())
                    .limit(e.getValue())
                    .forEach(b -> { picks.add(new ScoredBag(b, affinity.applyAsDouble(b))); chosen.add(b.getId()); });
            shownCategories.add(e.getKey());
        }

        // Discovery: best bag from each not-yet-shown category first (variety), then top up
        // by affinity. Also absorbs any shortfall when a preferred category lacked bags.
        if (picks.size() < topK) {
            Map<String, Bag> bestPerCat = new LinkedHashMap<>();
            for (Bag b : pool) {
                if (chosen.contains(b.getId())) continue;
                String c = b.getCategory() == null ? "" : b.getCategory();
                Bag cur = bestPerCat.get(c);
                if (cur == null || affinity.applyAsDouble(b) > affinity.applyAsDouble(cur)) bestPerCat.put(c, b);
            }
            bestPerCat.values().stream()
                    .sorted((a, b) -> {
                        boolean au = a.getCategory() == null || !shownCategories.contains(a.getCategory());
                        boolean bu = b.getCategory() == null || !shownCategories.contains(b.getCategory());
                        if (au != bu) return au ? -1 : 1;               // unseen categories first
                        return Double.compare(affinity.applyAsDouble(b), affinity.applyAsDouble(a));
                    })
                    .forEach(b -> {
                        if (picks.size() < topK && !chosen.contains(b.getId())) {
                            picks.add(new ScoredBag(b, affinity.applyAsDouble(b))); chosen.add(b.getId());
                        }
                    });
            if (picks.size() < topK) {   // fewer categories than open slots → fill by affinity
                pool.stream()
                        .filter(b -> !chosen.contains(b.getId()))
                        .sorted(Comparator.comparingDouble(affinity).reversed())
                        .limit(topK - picks.size())
                        .forEach(b -> { picks.add(new ScoredBag(b, affinity.applyAsDouble(b))); chosen.add(b.getId()); });
            }
        }

        return picks;
    }

    public record ScoredBag(Bag bag, double score) {}
}
