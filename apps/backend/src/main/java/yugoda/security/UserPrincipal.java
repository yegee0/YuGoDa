package yugoda.security;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserPrincipal {
    private String uid;
    private String email;
    private String role;
    private String displayName;
    private boolean exists;
}
