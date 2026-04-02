package yugoda.repository;

import yugoda.model.Bag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BagRepository extends JpaRepository<Bag, String> {
    List<Bag> findByRestaurantId(String restaurantId);

    @Query("SELECT COUNT(b) FROM Bag b WHERE b.restaurantId = :restaurantId")
    long countByRestaurantId(String restaurantId);
}
