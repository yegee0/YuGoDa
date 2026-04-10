package yugoda.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import yugoda.model.Bag;
import yugoda.model.Order;
import yugoda.model.Store;
import yugoda.model.User;

import java.util.List;
import java.util.Map;

/**
 * Centralised enrichment for JPA entities → API-ready maps.
 * Converts JSON-string columns into parsed objects and Integer booleans into real booleans.
 */
@Component
public class EntityEnricher {

    private final ObjectMapper objectMapper;

    public EntityEnricher(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ── Order ─────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> enrichOrder(Order order) {
        Map<String, Object> map = objectMapper.convertValue(order, Map.class);
        parseJsonField(map, "items", order.getItems(), List.of());
        toBooleanField(map, "leaveAtDoor", order.getLeaveAtDoor());
        return map;
    }

    // ── Bag ───────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> enrichBag(Bag bag) {
        Map<String, Object> map = objectMapper.convertValue(bag, Map.class);
        parseJsonField(map, "coordinates", bag.getCoordinates(), null);
        parseJsonField(map, "tags", bag.getTags(), List.of());
        toBooleanField(map, "isLastChance", bag.getIsLastChance());
        return map;
    }

    // ── User ──────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> enrichUser(User user) {
        Map<String, Object> map = objectMapper.convertValue(user, Map.class);
        parseJsonField(map, "favorites", user.getFavorites() != null ? user.getFavorites() : "[]", List.of());
        parseJsonField(map, "addresses", user.getAddresses() != null ? user.getAddresses() : "[]", List.of());
        toBooleanField(map, "notificationsEnabled", user.getNotificationsEnabled());
        return map;
    }

    // ── Store ─────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Map<String, Object> enrichStore(Store store) {
        Map<String, Object> map = objectMapper.convertValue(store, Map.class);
        parseJsonField(map, "location", store.getLocation(), null);
        parseJsonField(map, "operatingHours", store.getOperatingHours(), null);
        parseJsonField(map, "bankingDetails", store.getBankingDetails(), null);
        toBooleanField(map, "isApproved", store.getIsApproved());
        return map;
    }

    // ── Shared helpers ────────────────────────────────────────

    private void parseJsonField(Map<String, Object> map, String field, String json, Object defaultValue) {
        try {
            map.put(field, json != null ? objectMapper.readValue(json, Object.class) : defaultValue);
        } catch (Exception ignored) {
            map.put(field, defaultValue);
        }
    }

    private void toBooleanField(Map<String, Object> map, String field, Integer value) {
        map.put(field, value != null && value == 1);
    }
}
