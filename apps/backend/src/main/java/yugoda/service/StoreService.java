package yugoda.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Bag;
import yugoda.model.Notification;
import yugoda.model.Store;
import yugoda.repository.BagRepository;
import yugoda.repository.NotificationRepository;
import yugoda.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final BagRepository bagRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Store createStore(String uid, Map<String, Object> body) {
        String name = (String) body.get("name");

        if (storeRepository.existsById(uid)) {
            return storeRepository.findById(uid).orElseThrow();
        }

        Store store = new Store();
        store.setId(uid);
        store.setName(name);
        store.setCategory((String) body.getOrDefault("category", "Restaurant"));
        store.setDescription((String) body.getOrDefault("description", ""));
        store.setAddress((String) body.getOrDefault("address", ""));
        store.setPhone((String) body.getOrDefault("phone", ""));
        store.setEmail((String) body.getOrDefault("email", ""));
        store.setStatus("pending");

        try {
            if (body.get("location") != null) store.setLocation(objectMapper.writeValueAsString(body.get("location")));
            if (body.get("operatingHours") != null) store.setOperatingHours(objectMapper.writeValueAsString(body.get("operatingHours")));
        } catch (Exception ignored) {}

        return storeRepository.save(store);
    }

    public List<Store> listStores(String status) {
        if (status != null) return storeRepository.findByStatusOrderByCreatedAtDesc(status);
        return storeRepository.findAllByOrderByCreatedAtDesc();
    }

    public Map<String, Object> getStore(String storeId) {
        Store store = storeRepository.findById(storeId).orElse(null);
        List<Bag> bags = bagRepository.findByRestaurantId(storeId);

        if (store == null) {
            if (bags.isEmpty()) return null;
            Bag first = bags.get(0);
            Map<String, Object> virtualStore = new LinkedHashMap<>();
            virtualStore.put("id", storeId);
            virtualStore.put("name", first.getRestaurantName() != null ? first.getRestaurantName() : "Restaurant");
            virtualStore.put("category", first.getMerchantType() != null ? first.getMerchantType() : "Restaurant");
            virtualStore.put("description", "");
            virtualStore.put("address", "");
            virtualStore.put("isApproved", true);
            virtualStore.put("status", "active");
            virtualStore.put("rating", first.getRating() != null ? first.getRating() : 0);
            virtualStore.put("logo", first.getImage());
            virtualStore.put("operatingHours", null);
            virtualStore.put("location", parseJson(first.getCoordinates()));
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("store", virtualStore);
            result.put("bags", bags);
            return result;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("store", store);
        result.put("bags", bags);
        return result;
    }

    @Transactional
    public Store updateStore(String storeId, String uid, String role, Map<String, Object> body) {
        Store store = storeRepository.findById(storeId).orElseThrow(() -> new NoSuchElementException("Mağaza bulunamadı."));
        if (!"admin".equals(role) && !store.getId().equals(uid)) {
            throw new SecurityException("Bu mağazayı güncelleme yetkiniz yok.");
        }

        if (body.containsKey("name")) store.setName((String) body.get("name"));
        if (body.containsKey("category")) store.setCategory((String) body.get("category"));
        if (body.containsKey("description")) store.setDescription((String) body.get("description"));
        if (body.containsKey("address")) store.setAddress((String) body.get("address"));
        if (body.containsKey("phone")) store.setPhone((String) body.get("phone"));
        if (body.containsKey("email")) store.setEmail((String) body.get("email"));
        if (body.containsKey("logo")) store.setLogo((String) body.get("logo"));
        try {
            if (body.containsKey("location")) store.setLocation(objectMapper.writeValueAsString(body.get("location")));
            if (body.containsKey("operatingHours")) store.setOperatingHours(objectMapper.writeValueAsString(body.get("operatingHours")));
        } catch (Exception ignored) {}

        return storeRepository.save(store);
    }

    @Transactional
    public String approveStore(String storeId, boolean approved) {
        Store store = storeRepository.findById(storeId).orElseThrow(() -> new NoSuchElementException("Mağaza bulunamadı."));
        String newStatus = approved ? "active" : "rejected";
        store.setStatus(newStatus);
        store.setIsApproved(approved ? 1 : 0);
        storeRepository.save(store);

        // Notify owner
        Notification notif = new Notification();
        notif.setId(UUID.randomUUID().toString());
        notif.setUserId(storeId);
        notif.setTitle("Mağaza Durumu");
        notif.setMessage(approved
            ? "Mağazanız onaylandı! Artık ürün listeleyebilirsiniz."
            : "Mağaza başvurunuz reddedildi. Detaylar için destek ile iletişime geçin.");
        notificationRepository.save(notif);

        return newStatus;
    }

    private Object parseJson(String json) {
        if (json == null) return null;
        try { return objectMapper.readValue(json, Object.class); } catch (Exception e) { return null; }
    }
}
