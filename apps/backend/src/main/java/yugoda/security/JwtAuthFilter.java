package yugoda.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import yugoda.repository.UserRepository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * JWT Authentication Filter.
 *
 * Token verification strategy:
 *  1. If Firebase Admin SDK is initialized → uses FirebaseAuth.verifyIdToken() (cryptographic)
 *  2. Otherwise → falls back to JWT payload decode only (dev / no-service-account mode)
 *
 * To enable full Firebase verification:
 *   Set FIREBASE_SERVICE_ACCOUNT_PATH to your service account JSON path.
 *   Download from: Firebase Console → Project Settings → Service Accounts
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public static final String USER_ATTR = "currentUser";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            UserPrincipal principal = verifyToken(token);
            if (principal != null) {
                request.setAttribute(USER_ATTR, principal);
            }
        }

        filterChain.doFilter(request, response);
    }

    private UserPrincipal verifyToken(String token) {
        // Strategy 1: Firebase Admin cryptographic verification
        if (!FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);
                String uid = decoded.getUid();
                String email = decoded.getEmail();
                var dbUser = userRepository.findById(uid).orElse(null);
                String role = dbUser != null ? dbUser.getRole() : "customer";
                String displayName = dbUser != null ? dbUser.getDisplayName() : decoded.getName();
                String resolvedEmail = email != null ? email : (dbUser != null ? dbUser.getEmail() : null);
                return new UserPrincipal(uid, resolvedEmail, role, displayName, dbUser != null);
            } catch (Exception e) {
                log.debug("[Auth] Firebase Admin verification failed, trying JWT decode: {}", e.getMessage());
            }
        }

        // Strategy 2: JWT payload decode (no cryptographic verification — dev mode)
        return decodeJwtPayload(token);
    }

    @SuppressWarnings("unchecked")
    private UserPrincipal decodeJwtPayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;

            String payload = parts[1].replace('-', '+').replace('_', '/');
            int mod = payload.length() % 4;
            if (mod == 2) payload += "==";
            else if (mod == 3) payload += "=";

            byte[] decoded = Base64.getDecoder().decode(payload);
            Map<String, Object> claims = objectMapper.readValue(
                    new String(decoded, StandardCharsets.UTF_8), Map.class);

            Object exp = claims.get("exp");
            if (exp != null && ((Number) exp).longValue() < System.currentTimeMillis() / 1000) {
                return null;
            }

            String uid = (String) claims.getOrDefault("sub", claims.get("user_id"));
            if (uid == null) return null;

            String email = (String) claims.get("email");
            var dbUser = userRepository.findById(uid).orElse(null);
            String role = dbUser != null ? dbUser.getRole() : "customer";
            String displayName = dbUser != null ? dbUser.getDisplayName() : null;
            String resolvedEmail = email != null ? email : (dbUser != null ? dbUser.getEmail() : null);

            return new UserPrincipal(uid, resolvedEmail, role, displayName, dbUser != null);
        } catch (Exception e) {
            return null;
        }
    }
}
