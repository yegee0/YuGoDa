package yugoda.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Store;
import yugoda.model.User;
import yugoda.repository.NotificationRepository;
import yugoda.repository.ReviewRepository;
import yugoda.repository.StoreRepository;
import yugoda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ObjectMapper objectMapper;
    private final NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;

    @Transactional
    public User register(String uid, String email, Map<String, Object> body) {
        Optional<User> existing = userRepository.findById(uid);

        if (existing.isPresent()) {
            User user = existing.get();
            // Merge non-empty fields
            String displayName = (String) body.get("displayName");
            String firstName = (String) body.get("firstName");
            String lastName = (String) body.get("lastName");
            String phone = (String) body.get("phone");
            String businessName = (String) body.get("businessName");
            String address = (String) body.get("address");

            if (displayName != null && !displayName.isBlank() && user.getDisplayName() == null) user.setDisplayName(displayName);
            if (firstName != null && !firstName.isBlank() && user.getFirstName() == null) user.setFirstName(firstName);
            if (lastName != null && !lastName.isBlank() && user.getLastName() == null) user.setLastName(lastName);
            if (phone != null && !phone.isBlank() && user.getMobileNumber() == null) user.setMobileNumber(phone);

            userRepository.save(user);

            // Update store name if businessName provided
            if (businessName != null && "restaurant".equals(user.getRole())) {
                storeRepository.findById(uid).ifPresent(store -> {
                    if (store.getName() == null || store.getName().equals(user.getDisplayName()) || store.getName().equals(user.getEmail())) {
                        store.setName(businessName);
                        if (address != null && (store.getAddress() == null || store.getAddress().isBlank())) {
                            store.setAddress(address);
                        }
                        storeRepository.save(store);
                    }
                });
            }

            return userRepository.findById(uid).orElseThrow();
        }

        // Determine the allowed role for this self-signup.
        //
        // The "_principalRole" field is injected by UserController.register from the
        // JWT-decoded UserPrincipal (role derived from the Firebase project's issuer
        // claim). Clients cannot forge it. We trust it as a ceiling: the body's
        // requested role is honoured only when it matches the principal's role.
        //
        // Result matrix:
        //   principalRole=admin    + role=admin      → admin
        //   principalRole=restaurant + role=restaurant → restaurant
        //   anything else                             → customer
        String principalRole = body.getOrDefault("_principalRole", "customer").toString();
        String requestedRole = body.getOrDefault("role", "customer").toString();
        String role;
        if ("admin".equals(requestedRole) && "admin".equals(principalRole)) {
            role = "admin";
        } else if ("restaurant".equals(requestedRole)
                && ("restaurant".equals(principalRole) || "admin".equals(principalRole))) {
            role = "restaurant";
        } else {
            role = "customer";
        }
        // Idempotency guard: if an active user already exists with the same
        // email+role (e.g. two rapid Google sign-ins before the first insert
        // commits), return the existing row instead of creating a duplicate.
        // Case-insensitive to match the DB index created in DatabaseMigrationRunner.
        if (email != null && !email.isBlank()) {
            Optional<User> emailMatch = userRepository.findFirstByEmailIgnoreCaseAndRole(email, role);
            if (emailMatch.isPresent() && !"deleted".equals(emailMatch.get().getAccountStatus())) {
                log.warn("[USER_REGISTER] duplicate prevented — returning existing user uid={} email={} role={}",
                        emailMatch.get().getUid(), email, role);
                return emailMatch.get();
            }
        }

        User user = new User();
        user.setUid(uid);
        user.setEmail(email);
        user.setDisplayName((String) body.getOrDefault("displayName", ""));
        user.setFirstName((String) body.getOrDefault("firstName", ""));
        user.setLastName((String) body.getOrDefault("lastName", ""));
        user.setRole(role);
        user.setMobileNumber((String) body.getOrDefault("phone", ""));
        user.setFavorites("[]");
        user.setAddresses("[]");

        // Race-condition safety net: a second concurrent insert that slips past
        // the pre-check above will be blocked by the DB unique index. We catch
        // the violation and return the row that won the race instead of surfacing
        // a 500 to the client.
        try {
            userRepository.save(user);
            log.info("[USER_REGISTER] new user created uid={} email={} role={}", uid, email, role);
        } catch (DataIntegrityViolationException e) {
            log.warn("[USER_REGISTER] race condition resolved — unique index blocked duplicate insert, " +
                    "returning winner for email={} role={}", email, role);
            return userRepository.findFirstByEmailIgnoreCaseAndRole(email, role)
                    .orElseThrow(() -> e);
        }

        // Auto-create store for restaurant users
        if ("restaurant".equals(role)) {
            String businessName = (String) body.get("businessName");
            if (businessName != null) {
                if (!storeRepository.existsById(uid)) {
                    Store store = new Store();
                    store.setId(uid);
                    store.setName(businessName);
                    store.setCategory("Restaurant");
                    store.setAddress((String) body.getOrDefault("address", ""));
                    store.setStatus("pending");
                    storeRepository.save(store);
                }
            }
        }

        return userRepository.findById(uid).orElseThrow();
    }

    public User getProfile(String uid) {
        return userRepository.findById(uid).orElse(null);
    }

    /**
     * Idempotent profile fetch with backend-side lazy provisioning.
     *
     * The legacy flow had the frontend handle a GET /users/me 404 by POSTing to
     * /users/register, but that fallback lived inside a swallow-all `catch {}`
     * — when the register call failed for any reason (transient network, race
     * during the OAuth redirect, backend hiccup) the user was left signed-in
     * but rowless, and every subsequent /me kept returning 404 forever. The
     * symptom only showed up for Google sign-in since email/password signup
     * provisions the row explicitly via {@link #register}.
     *
     * Moving the provision into GET /me — which only fires for authenticated
     * users (JwtAuthFilter has already verified the token) — makes the row
     * guaranteed-to-exist for any signed-in caller, with no client-side
     * recovery dance.
     */
    @Transactional
    public User getOrCreateProfile(String uid, String email, String displayName, String role) {
        return userRepository.findById(uid).orElseGet(() -> {
            User u = new User();
            u.setUid(uid);
            // email is NOT NULL on the User entity. Firebase tokens always carry
            // an email claim for Google / email-password providers, but fall back
            // to empty string defensively so a malformed claim can never block
            // the bootstrap.
            u.setEmail(email != null ? email : "");
            if (displayName != null) u.setDisplayName(displayName);
            // Role precedence: the JWT-derived role wins over the entity default.
            // JwtAuthFilter resolves it from the issuer's Firebase project ID, so
            // a customer token can never escalate to admin or restaurant here.
            if (role != null) u.setRole(role);
            userRepository.save(u);

            // Restaurant Google sign-ins also need a paired store row — the
            // restaurant panel relies on a 1:1 user↔store mapping. Mirrors the
            // auto-create the existing register flow performs for explicit
            // restaurant signups.
            if ("restaurant".equals(role) && !storeRepository.existsById(uid)) {
                Store store = new Store();
                store.setId(uid);
                store.setName(displayName != null && !displayName.isBlank()
                        ? displayName : "My Restaurant");
                store.setCategory("Restaurant");
                store.setStatus("pending");
                storeRepository.save(store);
            }

            return u;
        });
    }

    @Transactional
    public User updateProfile(String uid, Map<String, Object> body) {
        User user = userRepository.findById(uid).orElseThrow();

        if (body.containsKey("displayName")) user.setDisplayName((String) body.get("displayName"));
        if (body.containsKey("firstName")) user.setFirstName((String) body.get("firstName"));
        if (body.containsKey("lastName")) user.setLastName((String) body.get("lastName"));
        // Email is decoupled from the Firebase auth identity: this column drives
        // app-side display + communication. The Firebase email remains the OAuth
        // login anchor and is never mutated from here.
        if (body.containsKey("email")) user.setEmail((String) body.get("email"));
        if (body.containsKey("photoURL")) user.setPhotoURL((String) body.get("photoURL"));
        if (body.containsKey("countryCode")) user.setCountryCode((String) body.get("countryCode"));
        if (body.containsKey("mobileNumber")) user.setMobileNumber((String) body.get("mobileNumber"));
        if (body.containsKey("notificationsEnabled")) {
            Object val = body.get("notificationsEnabled");
            user.setNotificationsEnabled(Boolean.TRUE.equals(val) ? 1 : 0);
        }
        if (body.containsKey("preferredLanguage")) user.setPreferredLanguage((String) body.get("preferredLanguage"));
        if (body.containsKey("language")) user.setLanguage((String) body.get("language"));
        if (body.containsKey("fcmToken")) user.setFcmToken((String) body.get("fcmToken"));
        if (body.containsKey("walletBalance")) {
            user.setWalletBalance(((Number) body.get("walletBalance")).doubleValue());
        }
        if (body.containsKey("location")) {
            try {
                user.setLocation(objectMapper.writeValueAsString(body.get("location")));
            } catch (Exception ignored) {}
        }
        if (body.containsKey("addresses")) {
            try {
                user.setAddresses(objectMapper.writeValueAsString(body.get("addresses")));
            } catch (Exception ignored) {}
        }

        return userRepository.save(user);
    }

    @Transactional
    public List<String> toggleFavorite(String uid, String bagId) {
        User user = userRepository.findById(uid).orElseThrow();
        List<String> favorites;
        try {
            favorites = objectMapper.readValue(
                user.getFavorites() != null ? user.getFavorites() : "[]",
                new TypeReference<List<String>>() {});
        } catch (Exception e) {
            favorites = new ArrayList<>();
        }

        if (favorites.contains(bagId)) {
            favorites.remove(bagId);
        } else {
            favorites.add(bagId);
        }

        try {
            user.setFavorites(objectMapper.writeValueAsString(favorites));
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Could not persist favorites", e);
        }
        return favorites;
    }

    @Transactional
    public User setAccountStatus(String uid, String status) {
        if (!"active".equals(status) && !"suspended".equals(status) && !"banned".equals(status)) {
            throw new IllegalArgumentException("Invalid account status.");
        }
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User not found."));
        user.setAccountStatus(status);
        return userRepository.save(user);
    }

    public List<User> listUsers(String role, String search) {
        List<User> all = userRepository.findAll();
        return all.stream()
            .filter(u -> role == null || role.equals(u.getRole()))
            .filter(u -> search == null || search.isBlank() ||
                (u.getDisplayName() != null && u.getDisplayName().toLowerCase().contains(search.toLowerCase())) ||
                (u.getEmail() != null && u.getEmail().toLowerCase().contains(search.toLowerCase())))
            .sorted(Comparator.comparing(u -> u.getCreatedAt() == null ? "" : u.getCreatedAt().toString(),
                    Comparator.reverseOrder()))
            .toList();
    }

    /**
     * Soft-deletes and anonymizes a user account in a single transaction.
     *
     * Idempotent: if the user is already deleted, returns immediately without
     * re-running the anonymization (safe for network retries and double-clicks).
     *
     * Transaction scope:
     *   1. Anonymize personal fields on User
     *   2. Hard-delete Notifications (no business value post-deletion)
     *   3. Null-out Review.userName (personal data; rating/comment preserved)
     * On any failure the entire transaction rolls back — no partial state.
     */
    @Transactional
    public void softDeleteUser(String uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User not found."));

        // Idempotency guard — second call is a no-op
        if (Boolean.TRUE.equals(user.getIsDeleted())) return;

        // 1. Flag and anonymize the User row
        user.setIsDeleted(true);
        user.setDeletedAt(java.time.LocalDateTime.now());
        user.setAccountStatus("deleted");
        // Email placeholder preserves the unique-email constraint while freeing
        // the original address for future re-registration.
        user.setEmail("deleted_user_" + uid + "@yugoda.deleted");
        user.setDisplayName("Deleted User");
        user.setFirstName(null);
        user.setLastName(null);
        user.setPhotoURL(null);
        user.setMobileNumber(null);
        user.setCountryCode(null);
        user.setAddresses("[]");
        user.setFavorites("[]");
        user.setLocation(null);
        user.setFcmToken(null);
        userRepository.save(user);

        // 2. Delete notifications (personal inbox, no business value)
        notificationRepository.deleteByUserId(uid);

        // 3. Anonymize review author names (rating and comment are preserved)
        reviewRepository.anonymizeByUserId(uid);
    }
}
