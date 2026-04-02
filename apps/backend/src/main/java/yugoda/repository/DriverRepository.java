package yugoda.repository;

import yugoda.model.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, String> {
    List<Driver> findByStatusOrderByRatingDesc(String status);
    List<Driver> findAllByOrderByRatingDesc();
}
