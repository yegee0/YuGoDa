package yugoda.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Store;
import yugoda.model.User;
import yugoda.repository.StoreRepository;
import yugoda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final ObjectMapper objectMapper;

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

        String role = body.getOrDefault("role", "customer").toString();
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
        userRepository.save(user);

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

    @Transactional
    public User updateProfile(String uid, Map<String, Object> body) {
        User user = userRepository.findById(uid).orElseThrow();

        if (body.containsKey("displayName")) user.setDisplayName((String) body.get("displayName"));
        if (body.containsKey("firstName")) user.setFirstName((String) body.get("firstName"));
        if (body.containsKey("lastName")) user.setLastName((String) body.get("lastName"));
        if (body.containsKey("photoURL")) user.setPhotoURL((String) body.get("photoURL"));
        if (body.containsKey("countryCode")) user.setCountryCode((String) body.get("countryCode"));
        if (body.containsKey("mobileNumber")) user.setMobileNumber((String) body.get("mobileNumber"));
        if (body.containsKey("notificationsEnabled")) {
            Object val = body.get("notificationsEnabled");
            user.setNotificationsEnabled(Boolean.TRUE.equals(val) ? 1 : 0);
        }
        if (body.containsKey("preferredLanguage")) user.setPreferredLanguage((String) body.get("preferredLanguage"));
        if (body.containsKey("language")) user.setLanguage((String) body.get("language"));
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
        } catch (Exception ignored) {}
        userRepository.save(user);
        return favorites;
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
}
