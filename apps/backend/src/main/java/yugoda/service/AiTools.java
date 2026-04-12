package yugoda.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import yugoda.model.Bag;
import yugoda.model.Order;
import yugoda.model.Store;
import yugoda.repository.BagRepository;
import yugoda.repository.OrderRepository;
import yugoda.repository.StoreRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Provides context-gathering methods used by the AI service to build
 * prompt context. These pull real data from PostgreSQL so the LLM
 * can reason over actual inventory and user history.
 */
@Component
@RequiredArgsConstructor
public class AiTools {

    private final BagRepository bagRepository;
    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;

    /**
     * Returns available surprise bags, optionally filtered by dietary type.
     */
    public List<BagSummary> getAvailableBags(String dietaryFilter) {
        return bagRepository.findAll().stream()
                .filter(b -> b.getAvailable() != null && b.getAvailable() > 0)
                .filter(b -> dietaryFilter == null || dietaryFilter.isBlank()
                        || (b.getDietaryType() != null && b.getDietaryType().toLowerCase().contains(dietaryFilter.toLowerCase())))
                .map(this::toBagSummary)
                .collect(Collectors.toList());
    }

    /**
     * Returns the user's recent orders (up to 10) for preference analysis.
     */
    public List<OrderSummary> getUserOrderHistory(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .limit(10)
                .map(this::toOrderSummary)
                .collect(Collectors.toList());
    }

    /**
     * Returns info about approved stores/restaurants on the platform.
     */
    public List<StoreSummary> getActiveStores() {
        return storeRepository.findByStatusOrderByCreatedAtDesc("active").stream()
                .map(this::toStoreSummary)
                .collect(Collectors.toList());
    }

    /**
     * Returns tags/dietary info for a specific store's bags.
     */
    public List<String> getStoreDietaryTags(String restaurantId) {
        return bagRepository.findByRestaurantId(restaurantId).stream()
                .map(Bag::getDietaryType)
                .filter(t -> t != null && !t.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    // ── Summary DTOs (kept as inner records for simplicity) ──────

    public record BagSummary(
            String id, String restaurantName, String category, String description,
            Double price, Double originalPrice, Integer available,
            String pickupTime, String dietaryType, String distance,
            String tags, Double rating
    ) {}

    public record OrderSummary(
            String id, String restaurantName, String items, Double total,
            String status, String createdAt
    ) {}

    public record StoreSummary(
            String id, String name, String category, String address,
            Double rating, String description
    ) {}

    // ── Mappers ──────────────────────────────────────────────────

    private BagSummary toBagSummary(Bag b) {
        return new BagSummary(
                b.getId(), b.getRestaurantName(), b.getCategory(), b.getDescription(),
                b.getPrice(), b.getOriginalPrice(), b.getAvailable(),
                b.getPickupTime(), b.getDietaryType(), b.getDistance(),
                b.getTags(), b.getRating()
        );
    }

    private OrderSummary toOrderSummary(Order o) {
        return new OrderSummary(
                o.getId(), o.getRestaurantName(), o.getItems(), o.getTotal(),
                o.getStatus(), o.getCreatedAt() != null ? o.getCreatedAt().toString() : null
        );
    }

    private StoreSummary toStoreSummary(Store s) {
        return new StoreSummary(
                s.getId(), s.getName(), s.getCategory(), s.getAddress(),
                s.getRating(), s.getDescription()
        );
    }
}
