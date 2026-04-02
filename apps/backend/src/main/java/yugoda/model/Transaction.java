package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    private String id;

    @Column(nullable = false)
    private String orderId;

    private String userId;
    private String restaurantId;

    @Column(nullable = false)
    private Double amount;

    private Double tip = 0.0;
    private String currency = "TRY";

    @Column(nullable = false)
    private String status = "pending";

    private String paymentMethod;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
