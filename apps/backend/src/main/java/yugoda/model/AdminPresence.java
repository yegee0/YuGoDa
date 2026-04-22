package yugoda.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "admin_presence")
public class AdminPresence {

    @Id
    private String adminUid;

    @Column(nullable = false)
    private String state = "offline";

    private LocalDateTime lastHeartbeatAt;

    private String currentConversationId;

    private LocalDateTime lastAssignedAt;
}
