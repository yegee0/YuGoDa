package yugoda.controller;

import yugoda.model.Bag;
import yugoda.model.Store;
import yugoda.repository.BagRepository;
import yugoda.repository.StoreRepository;
import yugoda.security.UserPrincipal;
import yugoda.service.BagService;
import yugoda.util.EntityEnricher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/bags")
@RequiredArgsConstructor
public class BagController extends BaseController {

    private final BagService bagService;
    private final BagRepository bagRepository;
    private final StoreRepository storeRepository;
    private final EntityEnricher enricher;

    // GET /
    @GetMapping
    public ResponseEntity<Map<String, Object>> listBags(
            @RequestParam(required = false) String dietaryType,
            @RequestParam(required = false) String merchantType,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String restaurantId,
            @RequestParam(defaultValue = "false") String showAll) {

        boolean showAllBool = "true".equals(showAll);
        List<Bag> bags = bagService.listBags(dietaryType, merchantType, minPrice, maxPrice,
                minRating, sortBy, search, restaurantId, showAllBool);

        // Cache full Store objects to avoid N+1 queries
        Map<String, Store> storeCache = new HashMap<>();
        List<Map<String, Object>> enriched = bags.stream().map(bag -> {
            Map<String, Object> map = enrichBag(bag);
            String rid = bag.getRestaurantId();
            if (!storeCache.containsKey(rid)) {
                storeCache.put(rid, storeRepository.findById(rid).orElse(null));
            }
            Store store = storeCache.get(rid);
            map.put("storeLogo",       store != null ? store.getLogo()       : null);
            map.put("storeCoverImage", store != null ? store.getCoverImage() : null);
            return map;
        }).toList();
        return ResponseEntity.ok(Map.of("success", true, "bags", enriched));
    }

    // GET /:id
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBag(@PathVariable String id) {
        return bagRepository.findById(id)
                .map(bag -> ResponseEntity.ok(Map.of("success", (Object) true, "bag", enrichBag(bag))))
                .orElseGet(() -> ResponseEntity.status(404)
                        .body(Map.of("success", false, "message", "Paket bulunamadı.")));
    }

    // POST /
    @PostMapping
    public ResponseEntity<Map<String, Object>> createBag(HttpServletRequest request,
                                                          @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (!hasRole(user, "restaurant", "admin")) return forbidden("Bu işlem için yetkiniz bulunmamaktadır.");

        if (body.get("price") == null || body.get("originalPrice") == null || body.get("available") == null) {
            return badRequest("price, originalPrice ve available alanları zorunludur.");
        }

        try {
            Bag bag = bagService.createBag(user.getUid(), user.getDisplayName(), body);
            return ResponseEntity.status(201).body(Map.of("success", true, "bag", enrichBag(bag)));
        } catch (Exception e) {
            return serverError("Paket oluşturulamadı.");
        }
    }

    // PUT /:id
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBag(HttpServletRequest request,
                                                          @PathVariable String id,
                                                          @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.isEmpty()) return badRequest("Güncellenecek alan bulunamadı.");
        try {
            Bag bag = bagService.updateBag(id, user.getUid(), user.getRole(), body);
            return ResponseEntity.ok(Map.of("success", true, "bag", enrichBag(bag)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return serverError("Paket güncellenemedi.");
        }
    }

    // DELETE /:id
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBag(HttpServletRequest request,
                                                          @PathVariable String id) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        try {
            bagService.deleteBag(id, user.getUid(), user.getRole());
            return ResponseEntity.ok(Map.of("success", true, "message", "Paket silindi."));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return serverError("Paket silinemedi.");
        }
    }

    private Map<String, Object> enrichBag(Bag bag) {
        return enricher.enrichBag(bag);
    }
}
