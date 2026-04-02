package yugoda.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Order;
import yugoda.security.UserPrincipal;
import yugoda.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController extends BaseController {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    // POST /
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOrder(HttpServletRequest request,
                                                            @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.get("restaurantId") == null || body.get("bagId") == null) {
            return badRequest("restaurantId ve bagId zorunludur.");
        }
        try {
            Order order = orderService.createOrder(user.getUid(), body);
            return ResponseEntity.status(201).body(Map.of("success", true, "order", enrichOrder(order)));
        } catch (Exception e) {
            return serverError("Sipariş oluşturulamadı.");
        }
    }

    // GET /
    @GetMapping
    public ResponseEntity<Map<String, Object>> listOrders(HttpServletRequest request,
                                                           @RequestParam(required = false) String status) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        List<Order> orders = orderService.listOrders(user.getUid(), user.getRole(), status);
        List<Map<String, Object>> enriched = orders.stream().map(this::enrichOrder).toList();
        return ResponseEntity.ok(Map.of("success", true, "orders", enriched));
    }

    // GET /:id
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOrder(HttpServletRequest request, @PathVariable String id) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        try {
            Order order = orderService.getOrder(id, user.getUid(), user.getRole());
            if (order == null) return notFound("Sipariş bulunamadı.");
            return ResponseEntity.ok(Map.of("success", true, "order", enrichOrder(order)));
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    // PUT /:id/status
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(HttpServletRequest request,
                                                             @PathVariable String id,
                                                             @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        String status = (String) body.get("status");
        if (status == null) return badRequest("status zorunludur.");
        try {
            Order order = orderService.updateStatus(id, user.getUid(), user.getRole(), status);
            return ResponseEntity.ok(Map.of("success", true, "order", enrichOrder(order)));
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> enrichOrder(Order order) {
        Map<String, Object> map = objectMapper.convertValue(order, Map.class);
        try {
            map.put("items", order.getItems() != null
                    ? objectMapper.readValue(order.getItems(), List.class) : List.of());
        } catch (Exception ignored) {}
        map.put("leaveAtDoor", order.getLeaveAtDoor() != null && order.getLeaveAtDoor() == 1);
        return map;
    }
}
