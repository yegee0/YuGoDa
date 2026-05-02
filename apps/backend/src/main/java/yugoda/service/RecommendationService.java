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

        // 2. ONNX inputs (history padded; mask zeroes out padding slots)
        long[] history = new long[historyLen];
        float[] historyMask = new float[historyLen];
        for (int i = 0; i < historyIdx.size(); i++) {
            history[i] = historyIdx.get(i);
            historyMask[i] = 1.0f;
        }
        long nHistory = historyIdx.size();
        Integer userIdxBoxed = userIdToIdx.get(userId);
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

    public record ScoredBag(Bag bag, double score) {}
}
