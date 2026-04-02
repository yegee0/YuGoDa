package yugoda.repository;

import yugoda.model.DisputeMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeMessageRepository extends JpaRepository<DisputeMessage, String> {
    List<DisputeMessage> findByDisputeIdOrderByCreatedAtAsc(String disputeId);
}
