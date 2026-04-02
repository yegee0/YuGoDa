package yugoda.service;

import yugoda.model.Dispute;
import yugoda.model.DisputeMessage;
import yugoda.repository.DisputeMessageRepository;
import yugoda.repository.DisputeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final DisputeMessageRepository messageRepository;

    @Transactional
    public Dispute createDispute(String uid, String role, Map<String, Object> body) {
        Dispute dispute = new Dispute();
        dispute.setId(UUID.randomUUID().toString());
        dispute.setUserId(uid);
        dispute.setOrderId((String) body.get("orderId"));
        dispute.setRestaurantId((String) body.get("restaurantId"));
        dispute.setSubject((String) body.get("subject"));
        dispute.setMessage((String) body.get("message"));
        dispute.setPriority((String) body.getOrDefault("priority", "medium"));
        dispute.setStatus("open");
        disputeRepository.save(dispute);

        // Add initial message to thread
        DisputeMessage msg = new DisputeMessage();
        msg.setId(UUID.randomUUID().toString());
        msg.setDisputeId(dispute.getId());
        msg.setSenderId(uid);
        msg.setSenderRole(role != null ? role : "restaurant");
        msg.setMessage((String) body.get("message"));
        messageRepository.save(msg);

        return dispute;
    }

    public List<Dispute> listDisputes(String uid, String role, String status) {
        List<Dispute> disputes;
        if ("admin".equals(role)) {
            disputes = status != null
                    ? disputeRepository.findByStatusOrderByCreatedAtDesc(status)
                    : disputeRepository.findAllByOrderByCreatedAtDesc();
        } else {
            disputes = status != null
                    ? disputeRepository.findByUserIdAndStatusOrderByCreatedAtDesc(uid, status)
                    : disputeRepository.findByUserIdOrderByCreatedAtDesc(uid);
        }
        return disputes;
    }

    @Transactional
    public Dispute updateDispute(String disputeId, Map<String, Object> body) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NoSuchElementException("Destek talebi bulunamadı."));
        if (body.containsKey("status")) dispute.setStatus((String) body.get("status"));
        if (body.containsKey("priority")) dispute.setPriority((String) body.get("priority"));
        return disputeRepository.save(dispute);
    }

    public List<DisputeMessage> getMessages(String disputeId, String uid, String role) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NoSuchElementException("Destek talebi bulunamadı."));
        if (!"admin".equals(role) && !dispute.getUserId().equals(uid)) {
            throw new SecurityException("Bu destek talebine erişim yetkiniz yok.");
        }

        List<DisputeMessage> messages = messageRepository.findByDisputeIdOrderByCreatedAtAsc(disputeId);
        if (messages.isEmpty()) {
            // Return initial message from dispute itself
            DisputeMessage initial = new DisputeMessage();
            initial.setId("initial-" + dispute.getId());
            initial.setDisputeId(dispute.getId());
            initial.setSenderId(dispute.getUserId());
            initial.setSenderRole("restaurant");
            initial.setMessage(dispute.getMessage());
            initial.setCreatedAt(dispute.getCreatedAt());
            return List.of(initial);
        }
        return messages;
    }

    @Transactional
    public DisputeMessage sendMessage(String disputeId, String uid, String role, String message) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NoSuchElementException("Destek talebi bulunamadı."));
        if (!"admin".equals(role) && !dispute.getUserId().equals(uid)) {
            throw new SecurityException("Bu destek talebine erişim yetkiniz yok.");
        }

        DisputeMessage msg = new DisputeMessage();
        msg.setId(UUID.randomUUID().toString());
        msg.setDisputeId(disputeId);
        msg.setSenderId(uid);
        msg.setSenderRole(role);
        msg.setMessage(message.trim());
        return messageRepository.save(msg);
    }
}
