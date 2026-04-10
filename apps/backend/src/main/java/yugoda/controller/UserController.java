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

    private Map<String, Object> enrichUser(User user) {
        return enricher.enrichUser(user);
    }
}
