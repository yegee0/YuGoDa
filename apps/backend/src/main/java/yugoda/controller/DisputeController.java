package yugoda.controller;

import yugoda.model.Dispute;
import yugoda.model.DisputeMessage;
import yugoda.security.UserPrincipal;
import yugoda.service.DisputeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController extends BaseController {

    private final DisputeService disputeService;

    // POST /
    @PostMapping
    public ResponseEntity<Map<String, Object>> createDispute(HttpServletRequest request,
                                                              @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.get("subject") == null || body.get("message") == null) {
            return badRequest("subject ve message zorunludur.");
        }
        try {
            Dispute dispute = disputeService.createDispute(user.getUid(), user.getRole(), body);
            return ResponseEntity.status(201).body(Map.of("success", true, "dispute", dispute));
        } catch (Exception e) {
            return serverError("Destek talebi oluşturulamadı.");
        }
    }

    // GET /
    @GetMapping
    public ResponseEntity<Map<String, Object>> listDisputes(HttpServletRequest request,
                                                             @RequestParam(required = false) String status) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        List<Dispute> disputes = disputeService.listDisputes(user.getUid(), user.getRole(), status);
        return ResponseEntity.ok(Map.of("success", true, "disputes", disputes));
    }

    // PUT /:id (admin)
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDispute(HttpServletRequest request,
                                                              @PathVariable String id,
                                                              @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (!hasRole(user, "admin")) return forbidden("Bu işlem için yetkiniz bulunmamaktadır.");
        if (body.isEmpty()) return badRequest("Güncellenecek alan bulunamadı.");
        try {
            Dispute dispute = disputeService.updateDispute(id, body);
            return ResponseEntity.ok(Map.of("success", true, "dispute", dispute));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        }
    }

    // GET /:id/messages
    @GetMapping("/{id}/messages")
    public ResponseEntity<Map<String, Object>> getMessages(HttpServletRequest request, @PathVariable String id) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        try {
            List<DisputeMessage> messages = disputeService.getMessages(id, user.getUid(), user.getRole());
            return ResponseEntity.ok(Map.of("success", true, "messages", messages));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    // POST /:id/messages
    @PostMapping("/{id}/messages")
    public ResponseEntity<Map<String, Object>> sendMessage(HttpServletRequest request,
                                                            @PathVariable String id,
                                                            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        String message = (String) body.get("message");
        if (message == null || message.isBlank()) return badRequest("Mesaj boş olamaz.");
        try {
            DisputeMessage msg = disputeService.sendMessage(id, user.getUid(), user.getRole(), message);
            return ResponseEntity.status(201).body(Map.of("success", true, "message", msg));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }
}
