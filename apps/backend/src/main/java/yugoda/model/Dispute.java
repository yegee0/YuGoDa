package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "disputes")
public class Dispute {

    @Id
    private String id;

    @Column(nullable = false)
    private String userId;

    private String orderId;
    private String restaurantId;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String status = "open";

    @Column(nullable = false)
    private String priority = "medium";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
