package yugoda.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Bag;
import yugoda.model.Notification;
import yugoda.model.Order;
import yugoda.model.Store;
import yugoda.model.Transaction;
import yugoda.model.User;
import yugoda.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final BagRepository bagRepository;
    private final StoreRepository storeRepository;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final FcmService fcmService;
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

        // Generate a 4-digit delivery verification code
        order.setDeliveryCode(String.valueOf(ThreadLocalRandom.current().nextInt(1000, 10000)));

        // Store customer delivery coordinates (only for delivery orders)
        if (body.get("deliveryLat") instanceof Number lat) order.setDeliveryLat(lat.doubleValue());
        if (body.get("deliveryLng") instanceof Number lng) order.setDeliveryLng(lng.doubleValue());

        // Determine requested quantity from items list (sum of quantities for matching bagId, default 1)
        int qty = 1;
        Object itemsRaw = body.get("items");
        if (itemsRaw instanceof List<?> itemsList) {
            int matched = 0;
            for (Object item : itemsList) {
                if (item instanceof Map<?, ?> m) {
                    Object id = m.get("id");
                    if (id != null && id.equals(bagId)) {
                        Object q = m.get("quantity");
                        if (q instanceof Number n) {
                            matched += n.intValue();
                        }
                    }
                }
            }
            if (matched > 0) qty = matched;
        }

        // Validate stock availability
        Bag orderBag = bagRepository.findById(bagId)
                .orElseThrow(() -> new IllegalArgumentException("Paket bulunamadı."));
        int avail = orderBag.getAvailable() != null ? orderBag.getAvailable() : 0;
        if (avail < qty) {
            if (avail == 0) {
                throw new IllegalArgumentException("Bu paket tükendi.");
            }
            throw new IllegalArgumentException("Yeterli stok yok. Yalnızca " + avail + " adet kaldı.");
        }

        // Validate that the store is currently open
        Store orderStore = storeRepository.findById(restaurantId).orElse(null);
        if (orderStore != null && !isStoreCurrentlyOpen(orderStore.getOperatingHours())) {
            throw new IllegalArgumentException("Restoran şu anda kapalı.");
        }

        // Wallet payment: validate balance and prepare deduction
        User walletUser = null;
        if ("wallet".equals(order.getPaymentMethod())) {
            walletUser = userRepository.findById(uid)
                    .orElseThrow(() -> new IllegalArgumentException("Kullanıcı bulunamadı."));
            double currentBalance = walletUser.getWalletBalance() != null ? walletUser.getWalletBalance() : 0.0;
            double chargeAmount = total > 0 ? total : price;
            if (currentBalance < chargeAmount) {
                throw new IllegalArgumentException("Yetersiz bakiye. Lütfen YuGoPay cüzdanınıza bakiye yükleyiniz.");
            }
        }

        orderRepository.save(order);

        // Decrease bag availability by the requested quantity
        orderBag.setAvailable(Math.max(avail - qty, 0));
        bagRepository.save(orderBag);

        // Deduct wallet balance after order is successfully saved
        if (walletUser != null && "wallet".equals(order.getPaymentMethod())) {
            double chargeAmount = total > 0 ? total : price;
            double newBalance = (walletUser.getWalletBalance() != null ? walletUser.getWalletBalance() : 0.0) - chargeAmount;
            walletUser.setWalletBalance(Math.max(newBalance, 0.0));
            userRepository.save(walletUser);
        }

        // Create transaction record with commission split
        double baseAmount = total > 0 ? total : price;
        double rate = 15.0;
        if (orderStore != null && orderStore.getCommissionRate() != null) {
            rate = orderStore.getCommissionRate();
        }
        double commissionAmt = baseAmount * (rate / 100.0);

        Transaction tx = new Transaction();
        tx.setId(UUID.randomUUID().toString());
        tx.setOrderId(order.getId());
        tx.setUserId(uid);
        tx.setRestaurantId(restaurantId);
        tx.setAmount(baseAmount);
        tx.setTip(tipAmount);
        tx.setCommissionRate(rate);
        tx.setCommissionAmount(commissionAmt);
        tx.setRestaurantAmount(baseAmount - commissionAmt);
        tx.setStatus("pending");
        tx.setPaymentMethod(order.getPaymentMethod());
        transactionRepository.save(tx);

        // Notify restaurant of the new order.
        Notification notif = new Notification();
        notif.setId(UUID.randomUUID().toString());
        notif.setUserId(restaurantId);
        notif.setTitle("New Order");
        notif.setMessage("A new order has been placed. Order ID: " + order.getId().substring(0, 8));
        notif.setTitleKey("notif_new_order_title");
        notif.setMessageKey("notif_new_order_message");
        notif.setOrderId(order.getId());
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
    public Order updateStatus(String orderId, String uid, String role, String status, String estimatedPickupTime, String trackingNotes, String inputDeliveryCode) {
        List<String> validStatuses = List.of("pending", "confirmed", "preparing", "ready",
                "picked_up", "delivering", "delivered", "cancelled");
        if (!validStatuses.contains(status)) {
            throw new IllegalArgumentException("Geçersiz durum.");
        }

        Order order = orderRepository.findById(orderId).orElseThrow(() -> new NoSuchElementException("Sipariş bulunamadı."));
        if (!"admin".equals(role) && !order.getRestaurantId().equals(uid) && !order.getUserId().equals(uid)) {
            throw new SecurityException("Bu siparişi güncelleme yetkiniz yok.");
        }

        // Verify delivery code when transitioning to delivered
        if ("delivered".equals(status) && order.getDeliveryCode() != null
                && inputDeliveryCode != null && !inputDeliveryCode.isBlank()) {
            if (!order.getDeliveryCode().equals(inputDeliveryCode.trim())) {
                throw new IllegalArgumentException("Geçersiz teslimat kodu.");
            }
        }

        order.setStatus(status);
        if (estimatedPickupTime != null) order.setEstimatedPickupTime(estimatedPickupTime);
        if (trackingNotes != null) order.setTrackingNotes(trackingNotes);
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
                int current = bag.getAvailable() != null ? bag.getAvailable() : 0;
                bag.setAvailable(current + 1);
                bagRepository.save(bag);
            });
        }

        orderRepository.save(order);

        // In-app notification (DB). Stable English fallback plus i18n keys so
        // the frontend can render in the recipient's preferred language.
        Map<String, String> messages = Map.of(
            "confirmed",  "Your order has been confirmed!",
            "preparing",  "Your order is being prepared.",
            "ready",      "Your order is ready!",
            "picked_up",  "Your order has been picked up.",
            "delivering", "Your order is on the way!",
            "delivered",  "Your order has been delivered.",
            "cancelled",  "Your order has been cancelled."
        );
        Map<String, String> messageKeys = Map.of(
            "confirmed",  "notif_order_confirmed",
            "preparing",  "notif_order_preparing",
            "ready",      "notif_order_ready",
            "picked_up",  "notif_order_picked_up",
            "delivering", "notif_order_delivering",
            "delivered",  "notif_order_delivered",
            "cancelled",  "notif_order_cancelled"
        );
        if (messages.containsKey(status)) {
            Notification notif = new Notification();
            notif.setId(UUID.randomUUID().toString());
            notif.setUserId(order.getUserId());
            notif.setTitle("Order Update");
            notif.setMessage(messages.get(status));
            notif.setTitleKey("notif_order_update_title");
            notif.setMessageKey(messageKeys.get(status));
            notif.setOrderId(order.getId());
            notificationRepository.save(notif);
        }

        // FCM push notification
        userRepository.findById(order.getUserId()).ifPresent(customer -> {
            String pushBody = switch (status) {
                case "preparing" -> "Your order has been confirmed and is being prepared.";
                case "ready"     -> "delivery".equals(order.getDeliveryType())
                        ? null  // delivery orders don't become ready for pickup
                        : "Your order is ready! You can pick it up from the restaurant.";
                case "picked_up" -> "Your order has been picked up.";
                case "delivering" -> "delivery".equals(order.getDeliveryType())
                        ? "Your order is on the way! It will be at your door soon."
                        : null;
                case "delivered" -> "Your order has been delivered. Enjoy!";
                case "cancelled" -> "Your order has been cancelled.";
                default -> null;
            };
            if (pushBody != null) {
                fcmService.sendPush(customer.getFcmToken(), "YuGoDa — Order Update", pushBody);
            }
        });

        return order;
    }

    private double toDouble(Object v) {
        if (v == null) return 0;
        return ((Number) v).doubleValue();
    }

    @SuppressWarnings("unchecked")
    private boolean isStoreCurrentlyOpen(String operatingHoursJson) {
        if (operatingHoursJson == null) return true;
        try {
            List<Map<String, Object>> schedule = objectMapper.readValue(operatingHoursJson, List.class);
            ZonedDateTime now = ZonedDateTime.now(ZoneId.of("Europe/Istanbul"));
            String dayName = now.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            Map<String, Object> slot = schedule.stream()
                    .filter(s -> dayName.equals(s.get("day")))
                    .findFirst().orElse(null);
            if (slot == null || !Boolean.TRUE.equals(slot.get("isOpen"))) return false;
            String currentTime = String.format("%02d:%02d", now.getHour(), now.getMinute());
            String open = (String) slot.get("open");
            String close = (String) slot.get("close");
            return currentTime.compareTo(open) >= 0 && currentTime.compareTo(close) <= 0;
        } catch (Exception e) {
            return true;
        }
    }
}
