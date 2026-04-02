package yugoda.repository;

import yugoda.model.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, String> {
    List<Dispute> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Dispute> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
    List<Dispute> findAllByOrderByCreatedAtDesc();
    List<Dispute> findByStatusOrderByCreatedAtDesc(String status);
}
