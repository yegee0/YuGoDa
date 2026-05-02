package yugoda.controller;

import ai.onnxruntime.OrtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import yugoda.security.UserPrincipal;
import yugoda.service.RecommendationService;
import yugoda.util.EntityEnricher;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController extends BaseController {

    private final RecommendationService recommendationService;
    private final EntityEnricher enricher;

    /**
     * Top-K bag recommendations for the authenticated user, ranked by the
     * trained two-tower model (cosine similarity in 256-d embedding space).
     *
     * <p>Query params:
     * <ul>
     *   <li>{@code limit} (default 10, max 50)</li>
     *   <li>{@code excludeOrdered} (default true) — drop bags the user has already ordered</li>
     * </ul>
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> myRecommendations(
            HttpServletRequest request,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "true") boolean excludeOrdered) {

        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (limit < 1 || limit > 50) return badRequest("limit 1-50 arasında olmalı.");

        if (!recommendationService.isReady()) {
            return serverError("Öneri modeli yüklenemedi.");
        }

        try {
            List<RecommendationService.ScoredBag> recs =
                    recommendationService.recommend(user.getUid(), limit, excludeOrdered);

            List<Map<String, Object>> enriched = recs.stream().map(rb -> {
                Map<String, Object> m = enricher.enrichBag(rb.bag());
                m.put("score", rb.score());
                return m;
            }).toList();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "recommendations", enriched,
                    "count", enriched.size()
            ));
        } catch (OrtException e) {
            return serverError("Öneri sistemi hatası: " + e.getMessage());
        }
    }

    /**
     * Health check — returns model readiness and basic config so admin/devs
     * can verify the model loaded correctly without invoking inference.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "ready", recommendationService.isReady()
        ));
    }
}
