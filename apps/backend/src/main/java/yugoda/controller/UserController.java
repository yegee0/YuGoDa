package yugoda.controller;

import yugoda.model.User;
import yugoda.security.UserPrincipal;
import yugoda.service.UserService;
import yugoda.util.EntityEnricher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController extends BaseController {

    private final UserService userService;
    private final EntityEnricher enricher;

    // POST /register
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(HttpServletRequest request,
                                                         @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        try {
            User registered = userService.register(user.getUid(), user.getEmail(), body);
            return ResponseEntity.status(201).body(Map.of("success", true, "user", registered));
        } catch (Exception e) {
            return serverError("Kayıt sırasında bir hata oluştu.");
        }
    }

    // GET /me
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getProfile(HttpServletRequest request) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        User dbUser = userService.getProfile(user.getUid());
        if (dbUser == null) return notFound("Kullanıcı bulunamadı.");
        Map<String, Object> enriched = enrichUser(dbUser);
        return ResponseEntity.ok(Map.of("success", true, "user", enriched));
    }

    // PUT /me
    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateProfile(HttpServletRequest request,
                                                              @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.isEmpty()) return badRequest("Güncellenecek alan bulunamadı.");
        try {
            User updated = userService.updateProfile(user.getUid(), body);
            return ResponseEntity.ok(Map.of("success", true, "user", enrichUser(updated)));
        } catch (Exception e) {
            return serverError("Profil güncellenemedi.");
        }
    }

    // PUT /me/favorites
    @PutMapping("/me/favorites")
    public ResponseEntity<Map<String, Object>> toggleFavorite(HttpServletRequest request,
                                                               @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        String bagId = (String) body.get("bagId");
        if (bagId == null) return badRequest("bagId gereklidir.");
        try {
            List<String> favorites = userService.toggleFavorite(user.getUid(), bagId);
            return ResponseEntity.ok(Map.of("success", true, "favorites", favorites));
        } catch (NoSuchElementException e) {
            return notFound("Kullanıcı bulunamadı.");
        }
    }

    // GET / (admin)
    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(HttpServletRequest request,
                                                          @RequestParam(required = false) String role,
                                                          @RequestParam(required = false) String search) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (!hasRole(user, "admin")) return forbidden("Bu işlem için yetkiniz bulunmamaktadır.");
        List<User> users = userService.listUsers(role, search);
        return ResponseEntity.ok(Map.of("success", true, "users", users));
    }

    // POST /{id}/suspend (admin)
    @PostMapping("/{id}/suspend")
    public ResponseEntity<Map<String, Object>> suspendUser(HttpServletRequest request, @PathVariable String id) {
        return setStatus(request, id, "suspended");
    }

    // POST /{id}/ban (admin)
    @PostMapping("/{id}/ban")
    public ResponseEntity<Map<String, Object>> banUser(HttpServletRequest request, @PathVariable String id) {
        return setStatus(request, id, "banned");
    }

    // POST /{id}/reinstate (admin)
    @PostMapping("/{id}/reinstate")
    public ResponseEntity<Map<String, Object>> reinstateUser(HttpServletRequest request, @PathVariable String id) {
        return setStatus(request, id, "active");
    }

    private ResponseEntity<Map<String, Object>> setStatus(HttpServletRequest request, String id, String status) {
        UserPrincipal actor = getUser(request);
        if (!requireAuth(actor)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (!hasRole(actor, "admin")) return forbidden("Admin role required.");
        if (actor.getUid().equals(id)) return badRequest("Admins cannot change their own account status.");
        try {
            User updated = userService.setAccountStatus(id, status);
            return ResponseEntity.ok(Map.of("success", true, "user", enrichUser(updated)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        }
    }

    private Map<String, Object> enrichUser(User user) {
        return enricher.enrichUser(user);
    }
}
