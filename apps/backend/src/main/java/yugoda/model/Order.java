package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String restaurantId;

    @Column(nullable = false)
    private String bagId;

    private String restaurantName;

    @Column(columnDefinition = "TEXT DEFAULT '[]'")
    private String items = "[]";

    private Double price;
    private Double tipAmount = 0.0;
    private Double tax = 0.0;
    private Double bookingFee = 0.0;
    private Double deliveryFee = 0.0;
    private Double total;

    @Column(nullable = false)
    private String status = "pending";

    private String deliveryType = "pickup";
    private String paymentMethod = "card";
    private Integer leaveAtDoor = 0;
    private String promoCode;
    private String driverId;

    @Column(columnDefinition = "TEXT")
    private String driverLocation;

    @Column(columnDefinition = "TEXT")
    private String proofOfDelivery;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime deliveredAt;
}
