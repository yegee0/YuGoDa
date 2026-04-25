package yugoda.controller;

import yugoda.model.User;
import yugoda.security.UserPrincipal;
import yugoda.service.UserService;
import yugoda.util.EntityEnricher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController extends BaseController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final EntityEnricher enricher;

    // POST /register
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(HttpServletRequest request,
                                                         @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        try {
            // Inject the JWT-derived role as a trusted hint so the service can
            // allow the full role (admin / restaurant) when the issuer grants it.
            // Clients cannot forge this: it comes from the verified/decoded JWT.
            Map<String, Object> enrichedBody = new java.util.HashMap<>(body);
            enrichedBody.put("_principalRole", user.getRole());
            User registered = userService.register(user.getUid(), user.getEmail(), enrichedBody);
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
        try {
            // Lazy-create the DB row from the verified JWT principal if it doesn't
            // exist yet. Closes the Google-sign-in hole where the frontend's
            // register-on-404 fallback could fail silently and leave the user
            // permanently rowless. JwtAuthFilter has already validated the token,
            // and the role is issuer-derived so it cannot be escalated by a client.
            User dbUser = userService.getOrCreateProfile(
                    user.getUid(), user.getEmail(), user.getDisplayName(), user.getRole());
            Map<String, Object> enriched = enrichUser(dbUser);
            return ResponseEntity.ok(Map.of("success", true, "user", enriched));
        } catch (Exception e) {
            log.error("[getProfile] uid={} error={}", user.getUid(), e.getMessage(), e);
            return serverError("Profil yüklenemedi.");
        }
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
            log.error("[updateProfile] uid={} keys={} error={}", user.getUid(), body.keySet(), e.getMessage(), e);
            return serverError("Profil güncellenemedi.");
        }
    }

    // PUT /me/favorites
    @PutMapping("/me/favorites")
    public ResponseEntity<Map<String, Object>> toggleFavorite(HttpServletRequest request,
                                                               @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        Object rawBagId = body.get("bagId");
        if (rawBagId == null) return badRequest("bagId gereklidir.");
        String bagId = rawBagId.toString();
        try {
            List<String> favorites = userService.toggleFavorite(user.getUid(), bagId);
            return ResponseEntity.ok(Map.of("success", true, "favorites", favorites));
        } catch (NoSuchElementException e) {
            return notFound("Kullanıcı bulunamadı.");
        } catch (Exception e) {
            return serverError("Favori güncellenemedi.");
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
