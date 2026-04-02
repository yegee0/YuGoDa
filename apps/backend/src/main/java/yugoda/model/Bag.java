package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bags")
public class Bag {

    @Id
    private String id;

    @Column(nullable = false)
    private String restaurantId;

    @Column(nullable = false)
    private String restaurantName;

    private String category;
    private String merchantType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Double originalPrice;

    @Column(nullable = false)
    private Integer available = 0;

    private String pickupTime;
    private String image;

    @Column(columnDefinition = "TEXT DEFAULT '[]'")
    private String tags = "[]";

    private Integer calories;
    private String dietaryType;
    private String distance;

    @Column(columnDefinition = "TEXT")
    private String coordinates;

    private Integer isLastChance = 0;
    private String countdown;
    private Double rating;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
