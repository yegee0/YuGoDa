package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_conversations")
public class ChatConversation {

    @Id
    private String id;

    @Column(nullable = false)
    private String customerId;

    private String adminId;

    @Column(nullable = false)
    private String status = "queued";

    private String adminResolution;

    @Version
    private Long version;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime assignedAt;

    private LocalDateTime endedAt;
}
