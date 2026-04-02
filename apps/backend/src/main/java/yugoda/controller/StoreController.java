package yugoda.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Bag;
import yugoda.model.Store;
import yugoda.security.UserPrincipal;
import yugoda.service.StoreService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController extends BaseController {

    private final StoreService storeService;
    private final ObjectMapper objectMapper;

    // POST /
    @PostMapping
    public ResponseEntity<Map<String, Object>> createStore(HttpServletRequest request,
                                                            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.get("name") == null) return badRequest("Mağaza adı zorunludur.");
        try {
            Store store = storeService.createStore(user.getUid(), body);
            return ResponseEntity.status(201).body(Map.of("success", true, "store", enrichStore(store)));
        } catch (Exception e) {
            return serverError("Mağaza oluşturulamadı.");
        }
    }

    // GET /
    @GetMapping
    public ResponseEntity<Map<String, Object>> listStores(@RequestParam(required = false) String status) {
        List<Store> stores = storeService.listStores(status);
        List<Map<String, Object>> enriched = stores.stream().map(this::enrichStore).toList();
        return ResponseEntity.ok(Map.of("success", true, "stores", enriched));
    }

    // GET /:id
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getStore(@PathVariable String id) {
        Map<String, Object> result = storeService.getStore(id);
        if (result == null) return notFound("Mağaza bulunamadı.");

        // Enrich store if it's a real Store object
        if (result.get("store") instanceof Store store) {
            result.put("store", enrichStore(store));
        }
        // Enrich bags
        if (result.get("bags") instanceof List<?> bags) {
            List<Map<String, Object>> enrichedBags = bags.stream()
                    .filter(b -> b instanceof Bag)
                    .map(b -> enrichBag((Bag) b))
                    .toList();
            result.put("bags", enrichedBags);
        }

        Map<String, Object> response = new LinkedHashMap<>(result);
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // PUT /:id
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateStore(HttpServletRequest request,
                                                            @PathVariable String id,
                                                            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.isEmpty()) return badRequest("Güncellenecek alan bulunamadı.");
        try {
            Store store = storeService.updateStore(id, user.getUid(), user.getRole(), body);
            return ResponseEntity.ok(Map.of("success", true, "store", enrichStore(store)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    // PUT /:id/approve (admin)
    @PutMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveStore(HttpServletRequest request,
                                                             @PathVariable String id,
                                                             @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (!hasRole(user, "admin")) return forbidden("Bu işlem için yetkiniz bulunmamaktadır.");
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        try {
            String status = storeService.approveStore(id, approved);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> enrichStore(Store store) {
        Map<String, Object> map = objectMapper.convertValue(store, Map.class);
        try {
            map.put("location", store.getLocation() != null
                    ? objectMapper.readValue(store.getLocation(), Object.class) : null);
            map.put("operatingHours", store.getOperatingHours() != null
                    ? objectMapper.readValue(store.getOperatingHours(), Object.class) : null);
        } catch (Exception ignored) {}
        map.put("isApproved", store.getIsApproved() != null && store.getIsApproved() == 1);
        return map;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> enrichBag(Bag bag) {
        Map<String, Object> map = objectMapper.convertValue(bag, Map.class);
        try {
            map.put("coordinates", bag.getCoordinates() != null
                    ? objectMapper.readValue(bag.getCoordinates(), Object.class) : null);
            map.put("tags", bag.getTags() != null
                    ? objectMapper.readValue(bag.getTags(), List.class) : List.of());
        } catch (Exception ignored) {}
        map.put("isLastChance", bag.getIsLastChance() != null && bag.getIsLastChance() == 1);
        return map;
    }
}
