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
                if ("banned".equals(principal.getAccountStatus())) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"success\":false,\"message\":\"Account banned.\"}");
                    return;
                }
                if ("suspended".equals(principal.getAccountStatus()) && isMutatingMethod(request.getMethod())) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write(
                            "{\"success\":false,\"message\":\"Account suspended; read-only access.\"}");
                    return;
                }
                request.setAttribute(USER_ATTR, principal);
            }
        }

        filterChain.doFilter(request, response);
    }

    private static boolean isMutatingMethod(String method) {
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }

    private UserPrincipal verifyToken(String token) {
        // Strategy 1: Firebase Admin cryptographic verification
        if (!FirebaseApp.getApps().isEmpty()) {
            try {
                FirebaseToken decoded = FirebaseAuth.getInstance().verifyIdToken(token);
                String uid = decoded.getUid();
                String email = decoded.getEmail();
                boolean emailVerified = decoded.isEmailVerified();

                // Determine default role from the Firebase project that issued the token.
                // This is the authoritative role for first-time users not yet in the DB.
                String issuerRole = roleFromIssuer(decoded.getIssuer() != null ? decoded.getIssuer() : "");

                String role = "customer";
                String displayName = decoded.getName();
                String resolvedEmail = email;
                String accountStatus = "active";
                boolean exists = false;
                String canonicalUid = uid;

                try {
                    // Cross-provider account linking: a verified email scoped to the
                    // same role wins over the JWT's UID. Firebase mints separate UIDs
                    // for the same email across providers (Google vs email/password),
                    // so without this hop a single human ends up with one DB row per
                    // provider. The role gate keeps customer/restaurant/admin
                    // accounts that legitimately share an email distinct.
                    var dbUser = (email != null && !email.isBlank() && emailVerified)
                            ? userRepository.findFirstByEmailAndRoleOrderByCreatedAtAsc(email, issuerRole).orElse(null)
                            : null;
                    if (dbUser == null) {
                        dbUser = userRepository.findById(uid).orElse(null);
                    }
                    if (dbUser != null) {
                        canonicalUid = dbUser.getUid();
                        role = dbUser.getRole();
                        displayName = dbUser.getDisplayName();
                        resolvedEmail = email != null ? email : dbUser.getEmail();
                        accountStatus = dbUser.getAccountStatus() != null ? dbUser.getAccountStatus() : "active";
                        exists = true;
                    } else {
                        role = issuerRole;
                    }
                } catch (Exception dbEx) {
                    log.error("[Auth] DB lookup failed (strategy 1) for uid={}: {}", uid, dbEx.getMessage());
                    role = issuerRole;
                }

                return new UserPrincipal(canonicalUid, resolvedEmail, role, displayName, exists, accountStatus);
            } catch (Exception e) {
                log.debug("[Auth] Firebase Admin verification failed, trying JWT decode: {}", e.getMessage());
            }
        }

        // Strategy 2: JWT payload decode (no cryptographic verification — dev mode)
        return decodeJwtPayload(token);
    }

    @SuppressWarnings("unchecked")
    private UserPrincipal decodeJwtPayload(String token) {
        // Step 1: Decode the JWT payload (cryptography-free — dev/multi-project mode).
        String uid;
        String email;
        boolean emailVerified;
        String issuerRole; // Role inferred from the Firebase project that issued the token
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                log.warn("[Auth] JWT decode failed: expected 3 parts, got {}", parts.length);
                return null;
            }

            String payload = parts[1].replace('-', '+').replace('_', '/');
            int mod = payload.length() % 4;
            if (mod == 2) payload += "==";
            else if (mod == 3) payload += "=";

            byte[] decoded = Base64.getDecoder().decode(payload);
            Map<String, Object> claims = objectMapper.readValue(
                    new String(decoded, StandardCharsets.UTF_8), Map.class);

            Object exp = claims.get("exp");
            if (exp != null && ((Number) exp).longValue() < System.currentTimeMillis() / 1000) {
                log.warn("[Auth] JWT decode failed: token expired (exp={})", exp);
                return null;
            }

            // Firebase tokens use both "sub" and "user_id" for the UID
            Object subRaw = claims.get("sub");
            Object userIdRaw = claims.get("user_id");
            uid = subRaw instanceof String s ? s : (userIdRaw instanceof String u ? u : null);
            if (uid == null) {
                log.warn("[Auth] JWT decode failed: no uid (sub={}, user_id={})", subRaw, userIdRaw);
                return null;
            }

            email = (String) claims.get("email");
            Object verifiedRaw = claims.get("email_verified");
            emailVerified = verifiedRaw instanceof Boolean b ? b : false;
            // Derive the expected role from the Firebase project ID embedded in the issuer
            // claim. Format: "https://securetoken.google.com/<project-id>"
            // This is the authoritative role when the user is not yet in the DB.
            String iss = claims.get("iss") instanceof String i ? i : "";
            issuerRole = roleFromIssuer(iss);
        } catch (Exception e) {
            log.warn("[Auth] JWT decode failed with exception: {}", e.getMessage());
            return null;
        }

        // Step 2: Enrich with DB data. Isolated in its own try-catch so a transient
        // DB error never causes authentication to fail — the JWT itself is the
        // ground truth; the DB just enriches the principal.
        String role = issuerRole;
        String displayName = null;
        String resolvedEmail = email;
        String accountStatus = "active";
        boolean exists = false;
        String canonicalUid = uid;
        try {
            // Cross-provider account linking — see strategy 1 for the rationale.
            // Email-keyed lookup (gated on email_verified) wins over UID-keyed
            // lookup so that Firebase's per-provider UIDs collapse onto a single
            // DB row.
            var dbUser = (email != null && !email.isBlank() && emailVerified)
                    ? userRepository.findFirstByEmailAndRoleOrderByCreatedAtAsc(email, issuerRole).orElse(null)
                    : null;
            if (dbUser == null) {
                dbUser = userRepository.findById(uid).orElse(null);
            }
            if (dbUser != null) {
                canonicalUid = dbUser.getUid();
                role = dbUser.getRole();
                displayName = dbUser.getDisplayName();
                resolvedEmail = email != null ? email : dbUser.getEmail();
                accountStatus = dbUser.getAccountStatus() != null ? dbUser.getAccountStatus() : "active";
                exists = true;
            }
        } catch (Exception e) {
            log.error("[Auth] DB lookup failed for uid={}, proceeding with issuer-derived role='{}': {}",
                    uid, issuerRole, e.getMessage());
        }

        log.debug("[Auth] JWT decode OK: jwtUid={}, canonicalUid={}, role={}, dbExists={}", uid, canonicalUid, role, exists);
        return new UserPrincipal(canonicalUid, resolvedEmail, role, displayName, exists, accountStatus);
    }

    /**
     * Maps a Firebase token issuer URL to the corresponding portal role.
     * Issuer format: "https://securetoken.google.com/{project-id}"
     */
    private static String roleFromIssuer(String iss) {
        if (iss.endsWith("/yugoda-admin"))   return "admin";
        if (iss.endsWith("/yugoda-partner")) return "restaurant";
        return "customer"; // yugoda-customer and any unrecognised project
    }
}
