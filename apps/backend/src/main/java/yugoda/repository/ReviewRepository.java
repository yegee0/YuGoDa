package yugoda.repository;

import yugoda.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByRestaurantIdOrderByCreatedAtDesc(String restaurantId);
    List<Review> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Review> findByRestaurantIdAndUserIdOrderByCreatedAtDesc(String restaurantId, String userId);
    List<Review> findAllByOrderByCreatedAtDesc();

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.restaurantId = :restaurantId")
    Double avgRatingByRestaurantId(String restaurantId);
}
