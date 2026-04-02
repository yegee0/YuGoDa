package yugoda.controller;

import yugoda.security.JwtAuthFilter;
import yugoda.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;

import java.util.Map;

/**
 * Base controller with auth helpers.
 */
public abstract class BaseController {

    protected UserPrincipal getUser(HttpServletRequest request) {
        return (UserPrincipal) request.getAttribute(JwtAuthFilter.USER_ATTR);
    }

    protected ResponseEntity<Map<String, Object>> unauthorized(String message) {
        return ResponseEntity.status(401).body(Map.of("success", false, "message", message));
    }

    protected ResponseEntity<Map<String, Object>> forbidden(String message) {
        return ResponseEntity.status(403).body(Map.of("success", false, "message", message));
    }

    protected ResponseEntity<Map<String, Object>> notFound(String message) {
        return ResponseEntity.status(404).body(Map.of("success", false, "message", message));
    }

    protected ResponseEntity<Map<String, Object>> badRequest(String message) {
        return ResponseEntity.status(400).body(Map.of("success", false, "message", message));
    }

    protected ResponseEntity<Map<String, Object>> serverError(String message) {
        return ResponseEntity.status(500).body(Map.of("success", false, "message", message));
    }

    protected boolean requireAuth(UserPrincipal user) {
        return user != null;
    }

    protected boolean hasRole(UserPrincipal user, String... roles) {
        if (user == null) return false;
        for (String role : roles) {
            if (role.equals(user.getRole())) return true;
        }
        return false;
    }
}
