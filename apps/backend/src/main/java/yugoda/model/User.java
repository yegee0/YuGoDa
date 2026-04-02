package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "uid")
    private String uid;

    @Column(nullable = false)
    private String email;

    private String displayName;
    private String firstName;
    private String lastName;
    private String photoURL;

    @Column(nullable = false)
    private String role = "customer";

    @Column(columnDefinition = "TEXT DEFAULT '[]'")
    private String favorites = "[]";

    @Column(columnDefinition = "TEXT")
    private String location;

    private String language = "en";
    private Double walletBalance = 0.0;
    private String countryCode;
    private String mobileNumber;

    @Column(columnDefinition = "TEXT DEFAULT '[]'")
    private String addresses = "[]";

    private Integer notificationsEnabled = 1;
    private String preferredLanguage = "en";

    @CreationTimestamp
    private LocalDateTime createdAt;
}
