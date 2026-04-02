package yugoda.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Notification;
import yugoda.model.Order;
import yugoda.model.Transaction;
import yugoda.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final BagRepository bagRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Order createOrder(String uid, Map<String, Object> body) {
        String restaurantId = (String) body.get("restaurantId");
        String bagId = (String) body.get("bagId");

        Order order = new Order();
        order.setId(UUID.randomUUID().toString());
        order.setUserId(uid);
        order.setRestaurantId(restaurantId);
        order.setBagId(bagId);
        order.setRestaurantName((String) body.getOrDefault("restaurantName", ""));
        order.setStatus("pending");
        order.setDeliveryType((String) body.getOrDefault("deliveryType", "pickup"));
        order.setPaymentMethod((String) body.getOrDefault("paymentMethod", "card"));
        order.setLeaveAtDoor(Boolean.TRUE.equals(body.get("leaveAtDoor")) ? 1 : 0);
        order.setPromoCode((String) body.get("promoCode"));

        double price = toDouble(body.get("price"));
        double tipAmount = toDouble(body.get("tipAmount"));
        double tax = toDouble(body.get("tax"));
        double bookingFee = toDouble(body.get("bookingFee"));
        double deliveryFee = toDouble(body.get("deliveryFee"));
        double total = toDouble(body.get("total"));

        order.setPrice(price);
        order.setTipAmount(tipAmount);
        order.setTax(tax);
        order.setBookingFee(bookingFee);
        order.setDeliveryFee(deliveryFee);
        order.setTotal(total);

        try {
            order.setItems(body.get("items") != null ? objectMapper.writeValueAsString(body.get("items")) : "[]");
        } catch (Exception ignored) { order.setItems("[]"); }

        orderRepository.save(order);

        // Decrease bag availability
        bagRepository.findById(bagId).ifPresent(bag -> {
            int avail = bag.getAvailable() != null ? bag.getAvailable() : 0;
            bag.setAvailable(Math.max(avail - 1, 0));
            bagRepository.save(bag);
        });

        // Create transaction record
        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID().toString());
        tx.setOrderId(order.getId());
        tx.setUserId(uid);
        tx.setRestaurantId(restaurantId);
        tx.setAmount(total > 0 ? total : price);
        tx.setTip(tipAmount);
        tx.setStatus("pending");
        tx.setPaymentMethod(order.getPaymentMethod());
        transactionRepository.save(tx);

        // Notify restaurant
        Notification notif = new Notification();
        notif.setId(UUID.randomUUID().toString());
        notif.setUserId(restaurantId);
        notif.setTitle("Yeni Sipariş");
        notif.setMessage("Yeni bir sipariş alındı. Sipariş ID: " + order.getId().substring(0, 8));
        notificationRepository.save(notif);

        return order;
    }

    public List<Order> listOrders(String uid, String role, String status) {
        List<Order> orders;
        if ("admin".equals(role)) {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        } else if ("restaurant".equals(role)) {
            orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(uid);
        } else {
            orders = orderRepository.findByUserIdOrderByCreatedAtDesc(uid);
        }

        if (status != null && !"all".equals(status)) {
            orders = orders.stream().filter(o -> status.equals(o.getStatus())).toList();
        }
        return orders;
    }

    public Order getOrder(String orderId, String uid, String role) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return null;
        if (!"admin".equals(role) && !order.getUserId().equals(uid) && !order.getRestaurantId().equals(uid)) {
            throw new SecurityException("Bu siparişi görüntüleme yetkiniz yok.");
        }
        return order;
    }

    @Transactional
    public Order updateStatus(String orderId, String uid, String role, String status) {
        List<String> validStatuses = List.of("pending", "confirmed", "preparing", "ready",
                "picked_up", "delivering", "delivered", "cancelled");
        if (!validStatuses.contains(status)) {
            throw new IllegalArgumentException("Geçersiz durum.");
        }

        Order order = orderRepository.findById(orderId).orElseThrow(() -> new NoSuchElementException("Sipariş bulunamadı."));
        if (!"admin".equals(role) && !order.getRestaurantId().equals(uid) && !order.getUserId().equals(uid)) {
            throw new SecurityException("Bu siparişi güncelleme yetkiniz yok.");
        }

        order.setStatus(status);
        if ("delivered".equals(status)) {
            order.setDeliveredAt(LocalDateTime.now());
            transactionRepository.findByOrderId(orderId).forEach(tx -> {
                tx.setStatus("completed");
                transactionRepository.save(tx);
            });
        }
        if ("cancelled".equals(status)) {
            transactionRepository.findByOrderId(orderId).forEach(tx -> {
                tx.setStatus("failed");
                transactionRepository.save(tx);
            });
            bagRepository.findById(order.getBagId()).ifPresent(bag -> {
                bag.setAvailable(bag.getAvailable() + 1);
                bagRepository.save(bag);
            });
        }

        orderRepository.save(order);

        // Send notification
        Map<String, String> messages = Map.of(
            "confirmed", "Siparişiniz onaylandı!",
            "preparing", "Siparişiniz hazırlanıyor.",
            "ready", "Siparişiniz hazır!",
            "delivering", "Siparişiniz yola çıktı!",
            "delivered", "Siparişiniz teslim edildi.",
            "cancelled", "Siparişiniz iptal edildi."
        );
        if (messages.containsKey(status)) {
            Notification notif = new Notification();
            notif.setId(UUID.randomUUID().toString());
            notif.setUserId(order.getUserId());
            notif.setTitle("Sipariş Güncelleme");
            notif.setMessage(messages.get(status));
            notificationRepository.save(notif);
        }

        return order;
    }

    private double toDouble(Object v) {
        if (v == null) return 0;
        return ((Number) v).doubleValue();
    }
}
