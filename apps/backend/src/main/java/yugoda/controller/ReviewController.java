package yugoda.controller;

import yugoda.model.Review;
import yugoda.security.UserPrincipal;
import yugoda.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController extends BaseController {

    private final ReviewService reviewService;

    // POST /
    @PostMapping
    public ResponseEntity<Map<String, Object>> createReview(HttpServletRequest request,
                                                             @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");

        if (body.get("restaurantId") == null || body.get("rating") == null) {
            return badRequest("restaurantId ve rating zorunludur.");
        }
        double rating = ((Number) body.get("rating")).doubleValue();
        if (rating < 1 || rating > 5) return badRequest("Rating 1-5 arasında olmalıdır.");

        try {
            Review review = reviewService.createReview(user.getUid(), body);
            return ResponseEntity.status(201).body(Map.of("success", true, "review", review));
        } catch (Exception e) {
            return serverError("Değerlendirme oluşturulamadı.");
        }
    }

    // GET /
    @GetMapping
    public ResponseEntity<Map<String, Object>> listReviews(
            @RequestParam(required = false) String restaurantId,
            @RequestParam(required = false) String userId) {
        List<Review> reviews = reviewService.listReviews(restaurantId, userId);
        return ResponseEntity.ok(Map.of("success", true, "reviews", reviews));
    }
}
