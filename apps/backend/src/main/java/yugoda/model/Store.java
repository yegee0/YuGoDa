package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "stores")
public class Store {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String address;

    @Column(columnDefinition = "TEXT")
    private String location;

    @Column(columnDefinition = "TEXT")
    private String operatingHours;

    private Integer isApproved = 0;
    private String status = "pending";
    private Double rating = 0.0;
    private String phone;
    private String email;
    private String logo;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
