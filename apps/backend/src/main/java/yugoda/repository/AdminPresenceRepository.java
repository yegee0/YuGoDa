package yugoda.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import yugoda.model.AdminPresence;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AdminPresenceRepository extends JpaRepository<AdminPresence, String> {
    List<AdminPresence> findByStateAndCurrentConversationIdIsNullOrderByLastAssignedAtAsc(String state);

    List<AdminPresence> findByState(String state);

    List<AdminPresence> findByLastHeartbeatAtBefore(LocalDateTime threshold);
}
