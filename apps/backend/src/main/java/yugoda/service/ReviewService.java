package yugoda.service;

import yugoda.model.Review;
import yugoda.repository.BagRepository;
import yugoda.repository.ReviewRepository;
import yugoda.repository.StoreRepository;
import yugoda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final StoreRepository storeRepository;
    private final BagRepository bagRepository;
    private final UserRepository userRepository;

    @Transactional
    public Review createReview(String uid, Map<String, Object> body) {
        String restaurantId = (String) body.get("restaurantId");
        double rating = ((Number) body.get("rating")).doubleValue();

        var user = userRepository.findById(uid).orElse(null);

        Review review = new Review();
        review.setId(UUID.randomUUID().toString());
        review.setUserId(uid);
        review.setRestaurantId(restaurantId);
        review.setOrderId((String) body.get("orderId"));
        review.setRating(rating);
        review.setComment((String) body.getOrDefault("comment", ""));
        review.setUserName(user != null ? user.getDisplayName() : "Anonim");
        reviewRepository.save(review);

        // Update average rating
        Double avg = reviewRepository.avgRatingByRestaurantId(restaurantId);
        if (avg != null) {
            double rounded = Math.round(avg * 10.0) / 10.0;
            storeRepository.findById(restaurantId).ifPresent(s -> {
                s.setRating(rounded);
                storeRepository.save(s);
            });
            bagRepository.findByRestaurantId(restaurantId).forEach(b -> {
                b.setRating(rounded);
                bagRepository.save(b);
            });
        }

        return review;
    }

    public List<Review> listReviews(String restaurantId, String userId) {
        if (restaurantId != null && userId != null) {
            return reviewRepository.findByRestaurantIdAndUserIdOrderByCreatedAtDesc(restaurantId, userId);
        } else if (restaurantId != null) {
            return reviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        } else if (userId != null) {
            return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }
}
