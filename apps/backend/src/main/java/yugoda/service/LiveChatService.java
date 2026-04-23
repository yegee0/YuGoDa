package yugoda.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import yugoda.model.AdminPresence;
import yugoda.model.ChatConversation;
import yugoda.model.ChatMessage;
import yugoda.model.Notification;
import yugoda.repository.AdminPresenceRepository;
import yugoda.repository.ChatConversationRepository;
import yugoda.repository.ChatMessageRepository;
import yugoda.repository.NotificationRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LiveChatService {

    private static final Logger log = LoggerFactory.getLogger(LiveChatService.class);

    private static final List<String> ACTIVE_STATUSES = List.of("queued", "active");
    private static final List<String> RESOLUTIONS = List.of("solved", "still_investigating");

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final AdminPresenceRepository presenceRepository;
    private final NotificationRepository notificationRepository;
    private final AdminPresenceService presenceService;

    /**
     * Optional — null-safe. Marked required=false so unit tests without a
     * WebSocket context still work. In production this bean is always present
     * because spring-boot-starter-websocket is on the classpath.
     */
    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // ── Conversation lifecycle ────────────────────────────────

    @Transactional
    public ChatConversation startConversation(String customerId, String initialMessage) {
        if (initialMessage == null || initialMessage.isBlank()) {
            throw new IllegalArgumentException("initialMessage is required.");
        }
        Optional<ChatConversation> existing = conversationRepository
                .findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(customerId, ACTIVE_STATUSES);
        if (existing.isPresent()) {
            throw new IllegalStateException("You already have an open conversation.");
        }

        ChatConversation conv = new ChatConversation();
        conv.setId(UUID.randomUUID().toString());
        conv.setCustomerId(customerId);
        conv.setStatus("queued");
        conversationRepository.save(conv);

        ChatMessage msg = new ChatMessage();
        msg.setId(UUID.randomUUID().toString());
        msg.setConversationId(conv.getId());
        msg.setSenderRole("customer");
        msg.setSenderUid(customerId);
        msg.setContent(initialMessage);
        messageRepository.save(msg);

        notifyAvailableAdmins(conv);

        // Push queue-changed event so the admin panel refreshes immediately
        pushQueueChanged();

        return conv;
    }

    public Optional<ChatConversation> findMyActive(String customerId) {
        return conversationRepository
                .findFirstByCustomerIdAndStatusInOrderByCreatedAtDesc(customerId, ACTIVE_STATUSES);
    }

    public List<ChatConversation> listQueued() {
        return conversationRepository.findByStatusOrderByCreatedAtAsc("queued");
    }

    public Optional<ChatConversation> findAdminActive(String adminUid) {
        return conversationRepository.findFirstByAdminIdAndStatus(adminUid, "active");
    }

    public int queuePosition(String conversationId) {
        List<ChatConversation> queue = conversationRepository.findByStatusOrderByCreatedAtAsc("queued");
        for (int i = 0; i < queue.size(); i++) {
            if (queue.get(i).getId().equals(conversationId)) return i + 1;
        }
        return 0;
    }

    @Transactional
    public ChatConversation assign(String conversationId, String adminUid) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found."));
        if (!"queued".equals(conv.getStatus())) {
            throw new IllegalStateException("Conversation is not queued.");
        }
        if (presenceService.isBusy(adminUid)) {
            throw new IllegalStateException("Admin is already handling a conversation.");
        }
        AdminPresence presence = presenceRepository.findById(adminUid)
                .orElseThrow(() -> new IllegalStateException("Admin is not available."));
        if (!"available".equals(presence.getState())) {
            throw new IllegalStateException("Admin is not available.");
        }

        conv.setAdminId(adminUid);
        conv.setStatus("active");
        conv.setAssignedAt(LocalDateTime.now());
        conversationRepository.save(conv);

        presenceService.assignConversation(adminUid, conv.getId());
        notifyCustomerAssigned(conv);

        // Push status update so the customer's LiveChatPanel transitions to ActiveView instantly
        pushConversationStatus(conv);
        // Push queue-changed so the admin queue list removes this conversation
        pushQueueChanged();

        return conv;
    }

    @Transactional
    public ChatMessage sendMessage(String conversationId, String senderUid, String senderRole, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content is required.");
        }
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found."));
        assertParticipant(conv, senderUid, senderRole);
        if (!ACTIVE_STATUSES.contains(conv.getStatus())) {
            throw new IllegalStateException("Conversation is not active.");
        }
        if ("queued".equals(conv.getStatus()) && !"customer".equals(senderRole)) {
            throw new IllegalStateException("Conversation must be assigned before non-customer replies.");
        }

        ChatMessage msg = new ChatMessage();
        msg.setId(UUID.randomUUID().toString());
        msg.setConversationId(conversationId);
        msg.setSenderRole(senderRole);
        msg.setSenderUid(senderUid);
        msg.setContent(content);
        messageRepository.save(msg);

        notifyCounterparty(conv, senderRole);

        // Push the new message to both participants via WebSocket
        pushMessage(msg);

        return msg;
    }

    public List<ChatMessage> listMessages(String conversationId, String requesterUid, String requesterRole,
                                          LocalDateTime since) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found."));
        assertParticipant(conv, requesterUid, requesterRole);
        if ("customer".equals(requesterRole) && "customer_deleted".equals(conv.getStatus())) {
            throw new ConversationArchivedException("Conversation archived.");
        }
        if (since == null) {
            return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        }
        return messageRepository.findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(conversationId, since);
    }

    public ChatConversation getConversationMetadata(String conversationId, String requesterUid, String requesterRole) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found."));
        boolean isOwningCustomer = "customer".equals(requesterRole) && requesterUid.equals(conv.getCustomerId());
        boolean isAdmin = "admin".equals(requesterRole);
        if (!isOwningCustomer && !isAdmin) {
            throw new SecurityException("Not a participant in this conversation.");
        }
        return conv;
    }

    public Optional<ChatConversation> findMyLastReceipt(String customerId) {
        return conversationRepository
                .findFirstByCustomerIdAndStatusInOrderByEndedAtDesc(
                        customerId, List.of("customer_deleted", "archived"));
    }

    @Transactional
    public ChatConversation endByAdmin(String conversationId, String adminUid, String resolution) {
        if (!RESOLUTIONS.contains(resolution)) {
            throw new IllegalArgumentException("Invalid resolution.");
        }
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found."));
        if (!adminUid.equals(conv.getAdminId())) {
            throw new SecurityException("Only the assigned admin can end this conversation.");
        }
        conv.setStatus("archived");
        conv.setAdminResolution(resolution);
        conv.setEndedAt(LocalDateTime.now());
        conversationRepository.save(conv);
        presenceService.releaseConversation(adminUid);

        // Notify customer the conversation ended (triggers receipt view via WebSocket)
        pushConversationStatus(conv);
        // Queue may have changed
        pushQueueChanged();

        return conv;
    }

    @Transactional
    public ChatConversation endByCustomer(String conversationId, String customerUid) {
        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NoSuchElementException("Conversation not found."));
        if (!customerUid.equals(conv.getCustomerId())) {
            throw new SecurityException("Only the owning customer can end this conversation.");
        }
        conv.setStatus("customer_deleted");
        conv.setEndedAt(LocalDateTime.now());
        conversationRepository.save(conv);
        if (conv.getAdminId() != null) {
            presenceService.releaseConversation(conv.getAdminId());
        }

        // Let the admin know the customer left
        pushConversationStatus(conv);
        pushQueueChanged();

        return conv;
    }

    // ── Failover ──────────────────────────────────────────────

    @Transactional
    public void requeueOrphanedConversations(List<String> offlineAdminUids) {
        if (offlineAdminUids.isEmpty()) return;
        for (String uid : offlineAdminUids) {
            conversationRepository.findFirstByAdminIdAndStatus(uid, "active").ifPresent(conv -> {
                conv.setAdminId(null);
                conv.setStatus("queued");
                conv.setAssignedAt(null);
                conversationRepository.save(conv);
                notifyAvailableAdmins(conv);
                pushConversationStatus(conv);
                pushQueueChanged();
            });
        }
    }

    // ── WebSocket push helpers ────────────────────────────────

    /**
     * Push a new ChatMessage to both participants: /topic/chat.{conversationId}
     */
    private void pushMessage(ChatMessage msg) {
        if (messagingTemplate == null) return;
        try {
            messagingTemplate.convertAndSend("/topic/chat." + msg.getConversationId(), msg);
        } catch (Exception e) {
            log.warn("[WS] pushMessage conv={} failed: {}", msg.getConversationId(), e.getMessage());
        }
    }

    /**
     * Push a conversation status change to /topic/chat.status.{conversationId}.
     * Frontend uses this to transition views (queued→active, active→archived, etc.)
     */
    private void pushConversationStatus(ChatConversation conv) {
        if (messagingTemplate == null) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", conv.getId());
            payload.put("status", conv.getStatus());
            payload.put("adminId", conv.getAdminId());
            messagingTemplate.convertAndSend("/topic/chat.status." + conv.getId(), payload);
        } catch (Exception e) {
            log.warn("[WS] pushConversationStatus conv={} failed: {}", conv.getId(), e.getMessage());
        }
    }

    /**
     * Push a lightweight "queue changed" event to /topic/chat.queue.
     * Admin panels subscribe and re-fetch the full queue list via REST.
     */
    private void pushQueueChanged() {
        if (messagingTemplate == null) return;
        try {
            messagingTemplate.convertAndSend("/topic/chat.queue", Map.of("event", "changed"));
        } catch (Exception e) {
            log.warn("[WS] pushQueueChanged failed: {}", e.getMessage());
        }
    }

    // ── Helpers ──────────────────────────────────────────────

    private void assertParticipant(ChatConversation conv, String uid, String role) {
        boolean isCustomer = "customer".equals(role) && uid.equals(conv.getCustomerId());
        boolean isAssignedAdmin = "admin".equals(role) && uid.equals(conv.getAdminId());
        if (!isCustomer && !isAssignedAdmin) {
            throw new SecurityException("Not a participant in this conversation.");
        }
    }

    private void notifyAvailableAdmins(ChatConversation conv) {
        List<AdminPresence> admins = presenceRepository
                .findByStateAndCurrentConversationIdIsNullOrderByLastAssignedAtAsc("available");
        for (AdminPresence admin : admins) {
            Notification n = new Notification();
            n.setId(UUID.randomUUID().toString());
            n.setUserId(admin.getAdminUid());
            n.setTitle("New Chat Request");
            n.setMessage("A customer is waiting in the queue.");
            n.setTitleKey("notif_chat_queued_title");
            n.setMessageKey("notif_chat_queued_message");
            notificationRepository.save(n);
        }
    }

    private void notifyCustomerAssigned(ChatConversation conv) {
        Notification n = new Notification();
        n.setId(UUID.randomUUID().toString());
        n.setUserId(conv.getCustomerId());
        n.setTitle("Chat Assigned");
        n.setMessage("An admin has joined your chat.");
        n.setTitleKey("notif_chat_assigned_title");
        n.setMessageKey("notif_chat_assigned_message");
        notificationRepository.save(n);
    }

    private void notifyCounterparty(ChatConversation conv, String senderRole) {
        String recipient = "customer".equals(senderRole) ? conv.getAdminId() : conv.getCustomerId();
        if (recipient == null) return;
        Notification n = new Notification();
        n.setId(UUID.randomUUID().toString());
        n.setUserId(recipient);
        n.setTitle("New Chat Message");
        n.setMessage("You have a new message in your live chat.");
        n.setTitleKey("notif_chat_message_title");
        n.setMessageKey("notif_chat_message_message");
        notificationRepository.save(n);
    }
}
