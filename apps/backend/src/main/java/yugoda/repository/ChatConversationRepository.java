package yugoda.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import yugoda.model.ChatConversation;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, String> {
    Optional<ChatConversation> findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(String customerId, List<String> statuses);

    Optional<ChatConversation> findFirstByCustomerIdAndStatusInOrderByEndedAtDesc(String customerId, List<String> statuses);

    List<ChatConversation> findByStatusOrderByCreatedAtAsc(String status);

    Optional<ChatConversation> findFirstByAdminIdAndStatus(String adminId, String status);
}
