package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "drivers")
public class Driver {

    @Id
    @Column(name = "uid")
    private String uid;

    private String displayName;
    private String status = "offline";

    @Column(columnDefinition = "TEXT")
    private String currentLocation;

    private String vehicleInfo;
    private String phone;
    private Double rating = 0.0;
    private Integer totalDeliveries = 0;
    private Double totalEarnings = 0.0;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
