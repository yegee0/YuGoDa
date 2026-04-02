package yugoda.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Bag;
import yugoda.model.Store;
import yugoda.model.User;
import yugoda.repository.BagRepository;
import yugoda.repository.StoreRepository;
import yugoda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class BagService {

    private final BagRepository bagRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public List<Bag> listBags(String dietaryType, String merchantType, Double minPrice, Double maxPrice,
                               Double minRating, String sortBy, String search, String restaurantId, boolean showAll) {

        boolean skipAvailableFilter = showAll && restaurantId != null;
        Stream<Bag> stream = bagRepository.findAll().stream();

        if (!skipAvailableFilter) {
            stream = stream.filter(b -> b.getAvailable() != null && b.getAvailable() > 0);
        }

        if (dietaryType != null) {
            List<String> types = Arrays.asList(dietaryType.split(","));
            stream = stream.filter(b -> b.getDietaryType() != null && types.contains(b.getDietaryType()));
        }
        if (merchantType != null) {
            List<String> types = Arrays.asList(merchantType.split(","));
            stream = stream.filter(b -> b.getMerchantType() != null && types.contains(b.getMerchantType()));
        }
        if (minPrice != null) stream = stream.filter(b -> b.getPrice() != null && b.getPrice() >= minPrice);
        if (maxPrice != null) stream = stream.filter(b -> b.getPrice() != null && b.getPrice() <= maxPrice);
        if (minRating != null) stream = stream.filter(b -> b.getRating() != null && b.getRating() >= minRating);
        if (restaurantId != null) stream = stream.filter(b -> restaurantId.equals(b.getRestaurantId()));
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            stream = stream.filter(b ->
                (b.getRestaurantName() != null && b.getRestaurantName().toLowerCase().contains(q)) ||
                (b.getCategory() != null && b.getCategory().toLowerCase().contains(q)) ||
                (b.getDescription() != null && b.getDescription().toLowerCase().contains(q)));
        }

        // Sorting
        Comparator<Bag> comparator;
        if ("lowest".equals(sortBy)) {
            comparator = Comparator.comparingDouble(b -> b.getPrice() != null ? b.getPrice() : 0);
        } else if ("highest".equals(sortBy)) {
            comparator = Comparator.comparingDouble((Bag b) -> b.getRating() != null ? b.getRating() : 0).reversed();
        } else if ("nearest".equals(sortBy)) {
            comparator = Comparator.comparingDouble(b -> {
                try { return Double.parseDouble(b.getDistance()); } catch (Exception e) { return Double.MAX_VALUE; }
            });
        } else {
            comparator = Comparator.comparing(b -> b.getCreatedAt() == null ? "" : b.getCreatedAt().toString(),
                    Comparator.reverseOrder());
        }

        List<Bag> bags = stream.sorted(comparator).toList();

        // Enrich with store open/closed status
        Map<String, String> storeCache = new HashMap<>();
        for (Bag bag : bags) {
            String rid = bag.getRestaurantId();
            if (!storeCache.containsKey(rid)) {
                Store store = storeRepository.findById(rid).orElse(null);
                storeCache.put(rid, store != null ? store.getOperatingHours() : null);
            }
        }

        return bags;
    }

    @Transactional
    public Bag createBag(String uid, String displayName, Map<String, Object> body) {
        Store store = storeRepository.findById(uid).orElse(null);
        User user = userRepository.findById(uid).orElse(null);
        String restaurantName = store != null ? store.getName()
                : (user != null ? user.getDisplayName() : displayName);
        if (restaurantName == null) restaurantName = "Unnamed Store";

        Bag bag = new Bag();
        bag.setId(UUID.randomUUID().toString());
        bag.setRestaurantId(uid);
        bag.setRestaurantName(restaurantName);
        bag.setCategory((String) body.get("category"));
        bag.setMerchantType((String) body.get("merchantType"));
        bag.setDescription((String) body.get("description"));
        bag.setPrice(toDouble(body.get("price")));
        bag.setOriginalPrice(toDouble(body.get("originalPrice")));
        bag.setAvailable(toInt(body.get("available")));
        bag.setPickupTime((String) body.get("pickupTime"));
        bag.setImage((String) body.get("image"));
        bag.setDietaryType((String) body.get("dietaryType"));
        bag.setCalories(toIntOrNull(body.get("calories")));
        bag.setDistance((String) body.get("distance"));
        bag.setIsLastChance(Boolean.TRUE.equals(body.get("isLastChance")) ? 1 : 0);
        bag.setCountdown((String) body.get("countdown"));

        try {
            bag.setTags(body.get("tags") != null ? objectMapper.writeValueAsString(body.get("tags")) : "[]");
            bag.setCoordinates(body.get("coordinates") != null ? objectMapper.writeValueAsString(body.get("coordinates")) : null);
        } catch (Exception ignored) {}

        return bagRepository.save(bag);
    }

    @Transactional
    public Bag updateBag(String bagId, String uid, String role, Map<String, Object> body) {
        Bag bag = bagRepository.findById(bagId).orElseThrow(() -> new NoSuchElementException("Paket bulunamadı."));

        if (!"admin".equals(role) && !bag.getRestaurantId().equals(uid)) {
            throw new SecurityException("Bu paketi güncelleme yetkiniz yok.");
        }

        if (body.containsKey("category")) bag.setCategory((String) body.get("category"));
        if (body.containsKey("merchantType")) bag.setMerchantType((String) body.get("merchantType"));
        if (body.containsKey("description")) bag.setDescription((String) body.get("description"));
        if (body.containsKey("price")) bag.setPrice(toDouble(body.get("price")));
        if (body.containsKey("originalPrice")) bag.setOriginalPrice(toDouble(body.get("originalPrice")));
        if (body.containsKey("available")) bag.setAvailable(toInt(body.get("available")));
        if (body.containsKey("pickupTime")) bag.setPickupTime((String) body.get("pickupTime"));
        if (body.containsKey("image")) bag.setImage((String) body.get("image"));
        if (body.containsKey("dietaryType")) bag.setDietaryType((String) body.get("dietaryType"));
        if (body.containsKey("calories")) bag.setCalories(toIntOrNull(body.get("calories")));
        if (body.containsKey("isLastChance")) bag.setIsLastChance(Boolean.TRUE.equals(body.get("isLastChance")) ? 1 : 0);
        if (body.containsKey("countdown")) bag.setCountdown((String) body.get("countdown"));
        if (body.containsKey("tags")) {
            try { bag.setTags(objectMapper.writeValueAsString(body.get("tags"))); } catch (Exception ignored) {}
        }

        return bagRepository.save(bag);
    }

    @Transactional
    public void deleteBag(String bagId, String uid, String role) {
        Bag bag = bagRepository.findById(bagId).orElseThrow(() -> new NoSuchElementException("Paket bulunamadı."));
        if (!"admin".equals(role) && !bag.getRestaurantId().equals(uid)) {
            throw new SecurityException("Bu paketi silme yetkiniz yok.");
        }
        bagRepository.delete(bag);
    }

    private double toDouble(Object v) {
        if (v == null) return 0;
        return ((Number) v).doubleValue();
    }
    private int toInt(Object v) {
        if (v == null) return 0;
        return ((Number) v).intValue();
    }
    private Integer toIntOrNull(Object v) {
        if (v == null) return null;
        return ((Number) v).intValue();
    }

    /**
     * Checks if a store is currently open based on its operating hours JSON.
     */
    @SuppressWarnings("unchecked")
    public boolean isStoreCurrentlyOpen(String operatingHoursJson) {
        if (operatingHoursJson == null) return true;
        try {
            List<Map<String, Object>> schedule = objectMapper.readValue(operatingHoursJson, List.class);
            String dayName = LocalDateTime.now().getDayOfWeek()
                    .getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            Map<String, Object> slot = schedule.stream()
                    .filter(s -> dayName.equals(s.get("day")))
                    .findFirst().orElse(null);
            if (slot == null || !Boolean.TRUE.equals(slot.get("isOpen"))) return false;
            LocalDateTime now = LocalDateTime.now();
            String currentTime = String.format("%02d:%02d", now.getHour(), now.getMinute());
            String open = (String) slot.get("open");
            String close = (String) slot.get("close");
            return currentTime.compareTo(open) >= 0 && currentTime.compareTo(close) <= 0;
        } catch (Exception e) {
            return true;
        }
    }
}
