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
 * <p>Cold-start handling: a user not present in {@code user2idx} (e.g. real
 * Firebase user, or user trained with no synthetic data) maps to user_idx=-1.
 * The ONNX graph adds +1 internally → falls onto the padding embedding (0),
 * so the recommendation collapses to history-only signal — safe fallback.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);
    private static final String MODEL_PATH = "models/user_tower.onnx";
    private static final String BAG_EMB_PATH = "models/bag_embeddings.json";
    private static final String VOCAB_PATH = "models/vocab.json";

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

        // 1. User history: delivered orders, newest first
        List<Order> userOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Integer> historyIdx = new ArrayList<>(historyLen);
        Set<String> orderedBagIds = new HashSet<>();
        for (Order o : userOrders) {
            if (!"delivered".equals(o.getStatus())) continue;
            orderedBagIds.add(o.getBagId());
            Integer idx = bagIdToIdx.get(o.getBagId());
            if (idx != null && historyIdx.size() < historyLen) {
                historyIdx.add(idx);
            }
        }

        // Cold-start fallback: real (Firebase) users won't be in synth-trained vocab.
        // If neither user_idx nor any history bag matches vocab, ONNX inference
        // would produce a constant zero user embedding → identical recs for every
        // real user, never changing. Use rating-weighted shuffle seeded by latest
        // order ID instead, so picks rotate when the user places new orders.
        Integer userIdxBoxed = userIdToIdx.get(userId);
        if (userIdxBoxed == null && historyIdx.isEmpty()) {
            log.debug("Cold-start fallback for user={} (vocab miss + no history match)", userId);
            return coldStartFallback(userOrders, topK, orderedBagIds, excludeOrdered);
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

    /**
     * Content-based fallback for cold-start users (UID + history both absent
     * from the synth-trained vocab). Reads the user's delivered order history,
     * derives feature distributions (category, dietary type, average price),
     * then scores every available bag against those preferences.
     *
     * <p>Score = weighted sum, higher is better:
     * <ul>
     *   <li>{@code categoryMatch} (×3.0) — fraction of history in this bag's category</li>
     *   <li>{@code dietaryMatch}  (×2.0) — fraction of history matching dietary type</li>
     *   <li>{@code priceMatch}    (×1.0) — sigmoid proximity to history avg price</li>
     *   <li>{@code ratingScore}   (×0.5) — bag's own rating, normalized 3.0-5.0 → 0-1</li>
     *   <li>{@code jitter}        (±0.01) — tie-breaker, seeded by latest order ID</li>
     * </ul>
     *
     * <p>For brand-new users (no history), the match-terms collapse to 0 and
     * ranking falls back to bag rating + per-user jitter (so different users
     * still get different orderings).
     *
     * <p>The latest-order seed makes the picks rotate when the user places a new
     * order — same content preference, slightly different shuffle.
     */
    private List<ScoredBag> coldStartFallback(List<Order> userOrders, int topK,
                                              Set<String> orderedBagIds, boolean excludeOrdered) {
        // Step 1: collect history bag features (delivered orders only)
        List<String> historyBagIds = userOrders.stream()
                .filter(o -> "delivered".equals(o.getStatus()))
                .map(Order::getBagId)
                .distinct()
                .toList();

        List<Bag> historyBags = historyBagIds.isEmpty()
                ? List.of()
                : bagRepository.findAllById(historyBagIds);

        Map<String, Long> categoryFreq = new HashMap<>();
        Map<String, Long> dietaryFreq = new HashMap<>();
        double priceSum = 0.0;
        int priceN = 0;
        for (Bag b : historyBags) {
            if (b.getCategory() != null) categoryFreq.merge(b.getCategory(), 1L, Long::sum);
            if (b.getDietaryType() != null) dietaryFreq.merge(b.getDietaryType(), 1L, Long::sum);
            if (b.getPrice() != null) { priceSum += b.getPrice(); priceN++; }
        }
        double avgPrice = (priceN > 0) ? (priceSum / priceN) : 100.0;  // fallback for empty history
        int historySize = historyBags.size();

        // Step 2: score all candidates, sort, take top-K
        long seed = userOrders.isEmpty() ? 0L : userOrders.get(0).getId().hashCode();
        Random rand = new Random(seed);

        List<Bag> all = bagRepository.findAll();
        record ScoredCandidate(Bag bag, double score) {}
        List<ScoredCandidate> scored = new ArrayList<>(all.size());

        for (Bag b : all) {
            if (b.getAvailable() == null || b.getAvailable() <= 0) continue;
            if (excludeOrdered && orderedBagIds.contains(b.getId())) continue;

            double catMatch = (historySize > 0 && b.getCategory() != null)
                    ? categoryFreq.getOrDefault(b.getCategory(), 0L) / (double) historySize
                    : 0.0;
            double dietMatch = (historySize > 0 && b.getDietaryType() != null)
                    ? dietaryFreq.getOrDefault(b.getDietaryType(), 0L) / (double) historySize
                    : 0.0;
            double priceMatch = (b.getPrice() != null)
                    ? 1.0 / (1.0 + Math.abs(b.getPrice() - avgPrice) / 50.0)
                    : 0.5;
            double ratingScore = (b.getRating() != null)
                    ? Math.max(0.0, (b.getRating() - 3.0) / 2.0)
                    : 0.0;

            double jitter = rand.nextDouble() * 0.01;
            double score = catMatch * 3.0 + dietMatch * 2.0 + priceMatch * 1.0 + ratingScore * 0.5 + jitter;
            scored.add(new ScoredCandidate(b, score));
        }
        if (scored.isEmpty()) return List.of();

        scored.sort((a, c) -> Double.compare(c.score(), a.score()));

        int n = Math.min(topK, scored.size());
        List<ScoredBag> picks = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            ScoredCandidate c = scored.get(i);
            picks.add(new ScoredBag(c.bag(), c.score()));
        }
        return picks;
    }

    public record ScoredBag(Bag bag, double score) {}
}
