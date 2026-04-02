package yugoda.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Notification;
import yugoda.security.UserPrincipal;
import yugoda.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController extends BaseController {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    // GET /
    @GetMapping
    public ResponseEntity<Map<String, Object>> listNotifications(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");

        List<Notification> notifications = notificationService.listNotifications(user.getUid());
        long unreadCount = notificationService.countUnread(user.getUid());

        List<Map<String, Object>> enriched = notifications.stream().map(n -> {
            Map<String, Object> map = objectMapper.convertValue(n, Map.class);
            map.put("read", n.getRead() != null && n.getRead() == 1);
            return map;
        }).toList();

        return ResponseEntity.ok(Map.of("success", true, "notifications", enriched, "unreadCount", unreadCount));
    }

    // PUT /:id/read
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(HttpServletRequest request, @PathVariable String id) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        try {
            notificationService.markRead(id, user.getUid());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    // POST /
    @PostMapping
    public ResponseEntity<Map<String, Object>> createNotification(HttpServletRequest request,
                                                                    @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");

        String userId = (String) body.get("userId");
        String title = (String) body.get("title");
        String message = (String) body.get("message");

        if (userId == null || title == null || message == null) {
            return badRequest("userId, title ve message zorunludur.");
        }

        Notification notif = notificationService.createNotification(userId, title, message);
        Map<String, Object> enriched = objectMapper.convertValue(notif, Map.class);
        enriched.put("read", notif.getRead() != null && notif.getRead() == 1);
        return ResponseEntity.status(201).body(Map.of("success", true, "notification", enriched));
    }
}
