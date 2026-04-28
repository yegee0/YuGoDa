package yugoda.repository;

import yugoda.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    /**
     * Cross-provider account lookup: same verified email + same role from a
     * different Firebase Auth provider should resolve to the existing DB row
     * instead of the duplicate Firebase mints. Scoped by role so a customer
     * token can never surface a restaurant or admin row that happens to share
     * the email. Ordered ASC so we prefer the oldest existing row (the
     * canonical one) when historical duplicates exist.
     */
    Optional<User> findFirstByEmailAndRoleOrderByCreatedAtAsc(String email, String role);

    /**
     * Case-insensitive email + role lookup used by the idempotent register
     * guard. Catches races where the same user signs in twice before the first
     * insert commits, and mirrors the case-insensitive DB index we create in
     * DatabaseMigrationRunner so the constraint and the guard agree on what
     * constitutes a "duplicate".
     */
    Optional<User> findFirstByEmailIgnoreCaseAndRole(String email, String role);
}
