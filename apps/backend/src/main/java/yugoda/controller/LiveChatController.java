package yugoda.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import yugoda.model.AdminPresence;
import yugoda.model.ChatConversation;
import yugoda.model.ChatMessage;
import yugoda.security.UserPrincipal;
import yugoda.service.AdminPresenceService;
import yugoda.service.ConversationArchivedException;
import yugoda.service.LiveChatService;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/live-chat")
@RequiredArgsConstructor
public class LiveChatController extends BaseController {

    private final LiveChatService liveChatService;
    private final AdminPresenceService presenceService;
    private final ObjectMapper objectMapper;

    // ── Customer ──────────────────────────────────────────────

    @PostMapping("/conversations")
    public ResponseEntity<Map<String, Object>> startConversation(HttpServletRequest request,
                                                                  @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "customer")) return forbidden("Customer role required.");
        try {
            ChatConversation conv = liveChatService.startConversation(
                    user.getUid(),
                    (String) body.get("initialMessage")
            );
            int position = liveChatService.queuePosition(conv.getId());
            return ResponseEntity.status(201).body(Map.of(
                    "success", true,
                    "conversation", toMap(conv),
                    "queuePosition", position
            ));
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/conversations/my")
    public ResponseEntity<Map<String, Object>> myConversation(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "customer")) return forbidden("Customer role required.");
        return liveChatService.findMyActive(user.getUid())
                .map(conv -> ResponseEntity.ok(Map.of(
                        "success", true,
                        "conversation", toMap(conv),
                        "queuePosition", liveChatService.queuePosition(conv.getId())
                )))
                .orElseGet(() -> ResponseEntity.ok(Map.of("success", true, "conversation", (Object) null)));
    }

    // ── Admin ─────────────────────────────────────────────────

    @GetMapping("/conversations/queued")
    public ResponseEntity<Map<String, Object>> queuedConversations(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "admin")) return forbidden("Admin role required.");
        List<Map<String, Object>> queued = liveChatService.listQueued().stream()
                .map(this::toMap).toList();
        Map<String, Object> active = liveChatService.findAdminActive(user.getUid())
                .map(this::toMap).orElse(null);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "queued", queued,
                "active", active == null ? Map.of() : active
        ));
    }

    @PostMapping("/conversations/{id}/assign")
    public ResponseEntity<Map<String, Object>> assign(HttpServletRequest request, @PathVariable String id) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "admin")) return forbidden("Admin role required.");
        try {
            ChatConversation conv = liveChatService.assign(id, user.getUid());
            return ResponseEntity.ok(Map.of("success", true, "conversation", toMap(conv)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (OptimisticLockingFailureException e) {
            return ResponseEntity.status(409).body(Map.of(
                    "success", false, "message", "Conversation no longer queued."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ── Both parties ──────────────────────────────────────────

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(HttpServletRequest request,
                                                            @PathVariable String id,
                                                            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "customer", "admin")) return forbidden("Customer or admin role required.");
        try {
            ChatMessage msg = liveChatService.sendMessage(
                    id,
                    user.getUid(),
                    user.getRole(),
                    (String) body.get("content")
            );
            return ResponseEntity.status(201).body(Map.of("success", true, "message", toMap(msg)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", e.getMessage()));
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<Map<String, Object>> listMessages(HttpServletRequest request,
                                                             @PathVariable String id,
                                                             @RequestParam(required = false) Long since) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "customer", "admin")) return forbidden("Customer or admin role required.");
        try {
            LocalDateTime sinceTime = since == null ? null
                    : LocalDateTime.ofInstant(Instant.ofEpochMilli(since), ZoneId.systemDefault());
            List<Map<String, Object>> messages = liveChatService
                    .listMessages(id, user.getUid(), user.getRole(), sinceTime).stream()
                    .map(this::toMap).toList();
            return ResponseEntity.ok(Map.of("success", true, "messages", messages));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (ConversationArchivedException e) {
            return ResponseEntity.status(410).body(Map.of("success", false, "message", e.getMessage()));
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    // GET /conversations/my-last-receipt — most-recent ended conversation for the customer.
    // Placed before /conversations/{id} so the literal path wins resolution.
    @GetMapping("/conversations/my-last-receipt")
    public ResponseEntity<Map<String, Object>> myLastReceipt(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "customer")) return forbidden("Customer role required.");
        return liveChatService.findMyLastReceipt(user.getUid())
                .map(conv -> ResponseEntity.ok(Map.of("success", true, "conversation", toMap(conv))))
                .orElseGet(() -> ResponseEntity.ok(Map.of("success", true, "conversation", (Object) null)));
    }

    // GET /conversations/{id} — conversation metadata only (no messages).
    @GetMapping("/conversations/{id}")
    public ResponseEntity<Map<String, Object>> getConversation(HttpServletRequest request, @PathVariable String id) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "customer", "admin")) return forbidden("Customer or admin role required.");
        try {
            ChatConversation conv = liveChatService.getConversationMetadata(id, user.getUid(), user.getRole());
            return ResponseEntity.ok(Map.of("success", true, "conversation", toMap(conv)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    @PostMapping("/conversations/{id}/end")
    public ResponseEntity<Map<String, Object>> endConversation(HttpServletRequest request,
                                                                @PathVariable String id,
                                                                @RequestBody(required = false) Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        try {
            ChatConversation conv;
            if (hasRole(user, "admin")) {
                String resolution = body == null ? null : (String) body.get("resolution");
                conv = liveChatService.endByAdmin(id, user.getUid(), resolution);
            } else if (hasRole(user, "customer")) {
                conv = liveChatService.endByCustomer(id, user.getUid());
            } else {
                return forbidden("Customer or admin role required.");
            }
            return ResponseEntity.ok(Map.of("success", true, "conversation", toMap(conv)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    // ── Availability (any authed user) ────────────────────────

    @GetMapping("/availability")
    public ResponseEntity<Map<String, Object>> availability(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        long count = presenceService.countAvailable();
        return ResponseEntity.ok(Map.of("success", true, "availableAdmins", count));
    }

    // ── Admin presence heartbeat ──────────────────────────────

    @PutMapping("/admin/presence")
    public ResponseEntity<Map<String, Object>> updatePresence(HttpServletRequest request,
                                                               @RequestBody(required = false) Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Authentication token not found.");
        if (!hasRole(user, "admin")) return forbidden("Admin role required.");
        String state = body == null ? "available" : (String) body.getOrDefault("state", "available");
        AdminPresence presence = presenceService.heartbeat(user.getUid(), state);
        return ResponseEntity.ok(Map.of("success", true, "presence", toMap(presence)));
    }

    // ── Serialization helper ──────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object o) {
        return objectMapper.convertValue(o, Map.class);
    }
}
