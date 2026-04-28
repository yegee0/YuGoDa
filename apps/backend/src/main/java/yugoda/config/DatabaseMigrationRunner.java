package yugoda.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Runs lightweight, idempotent schema fixes on startup.
 *
 * Hibernate ddl-auto=update will ADD missing columns but will NOT widen existing
 * column types (e.g. VARCHAR → TEXT), and may fail to add columns when the DB
 * user lacks DDL permissions. This runner fills both gaps.
 *
 * If a migration fails the error is logged at ERROR level with the exact manual
 * SQL so an operator can run it in Cloud SQL Studio.
 */
@Component
@RequiredArgsConstructor
public class DatabaseMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        log.info("[Migration] Starting schema migrations...");
        migrateUsers();
        migrateOrders();
        migrateNotifications();
        migrateStores();
        migrateUniqueEmailRoleIndex();
        verifyMigrations();
        log.info("[Migration] Schema migrations complete.");
    }

    // ── per-table migrations ──────────────────────────────────────────────────

    private void migrateUsers() {
        // NOT NULL columns require a DEFAULT so existing rows are backfilled
        addColumnIfMissing("users", "account_status",        "VARCHAR(255) NOT NULL DEFAULT 'active'");
        addColumnIfMissing("users", "display_name",          "VARCHAR(255)");
        addColumnIfMissing("users", "first_name",            "VARCHAR(255)");
        addColumnIfMissing("users", "last_name",             "VARCHAR(255)");
        addColumnIfMissing("users", "language",              "VARCHAR(255) DEFAULT 'en'");
        addColumnIfMissing("users", "wallet_balance",        "DOUBLE PRECISION DEFAULT 0.0");
        addColumnIfMissing("users", "country_code",          "VARCHAR(255)");
        addColumnIfMissing("users", "mobile_number",         "VARCHAR(255)");
        addColumnIfMissing("users", "notifications_enabled", "INTEGER DEFAULT 1");
        addColumnIfMissing("users", "preferred_language",    "VARCHAR(255) DEFAULT 'en'");
        addColumnIfMissing("users", "fcm_token",             "VARCHAR(255)");
        // photo_url: add if missing, then widen VARCHAR → TEXT
        addColumnIfMissing("users", "photo_url",             "TEXT");
        alterToTextIfNeeded("users", "photo_url");
        addColumnIfMissing("users", "favorites",             "TEXT DEFAULT '[]'");
        alterToTextIfNeeded("users", "favorites");
        addColumnIfMissing("users", "location",              "TEXT");
        alterToTextIfNeeded("users", "location");
        addColumnIfMissing("users", "addresses",             "TEXT DEFAULT '[]'");
        alterToTextIfNeeded("users", "addresses");
        // Soft-delete fields (KVKK/GDPR account deletion)
        addColumnIfMissing("users", "is_deleted",            "BOOLEAN NOT NULL DEFAULT false");
        addColumnIfMissing("users", "deleted_at",            "TIMESTAMP");
    }

    private void migrateOrders() {
        addColumnIfMissing("orders", "tip_amount",            "DOUBLE PRECISION DEFAULT 0");
        addColumnIfMissing("orders", "tax",                   "DOUBLE PRECISION DEFAULT 0");
        addColumnIfMissing("orders", "booking_fee",           "DOUBLE PRECISION DEFAULT 0");
        addColumnIfMissing("orders", "delivery_fee",          "DOUBLE PRECISION DEFAULT 0");
        addColumnIfMissing("orders", "total",                 "DOUBLE PRECISION");
        addColumnIfMissing("orders", "promo_code",            "VARCHAR(255)");
        addColumnIfMissing("orders", "driver_id",             "VARCHAR(255)");
        addColumnIfMissing("orders", "driver_location",       "TEXT");
        addColumnIfMissing("orders", "proof_of_delivery",     "TEXT");
        addColumnIfMissing("orders", "delivered_at",          "TIMESTAMP WITHOUT TIME ZONE");
        addColumnIfMissing("orders", "estimated_pickup_time", "VARCHAR(255)");
        addColumnIfMissing("orders", "tracking_notes",        "TEXT");
        addColumnIfMissing("orders", "delivery_code",         "VARCHAR(255)");
        addColumnIfMissing("orders", "delivery_lat",          "DOUBLE PRECISION");
        addColumnIfMissing("orders", "delivery_lng",          "DOUBLE PRECISION");
        // items: add if missing, then widen VARCHAR → TEXT
        addColumnIfMissing("orders", "items",                 "TEXT DEFAULT '[]'");
        alterToTextIfNeeded("orders", "items");
    }

    private void migrateNotifications() {
        addColumnIfMissing("notifications", "title_key",   "VARCHAR(255)");
        addColumnIfMissing("notifications", "message_key", "VARCHAR(255)");
        addColumnIfMissing("notifications", "order_id",    "VARCHAR(255)");
    }

    private void migrateStores() {
        alterToTextIfNeeded("stores", "logo");
    }

    private void migrateUniqueEmailRoleIndex() {
        try {
            // Version detection: the v1 index has "email IS NOT NULL" in its predicate.
            // If the current index already has the tighter predicate (or doesn't exist
            // yet) we proceed; if it's v1 we upgrade it.
            String currentDef = null;
            try {
                currentDef = jdbcTemplate.queryForObject(
                        "SELECT indexdef FROM pg_indexes WHERE indexname = 'users_email_role_active_unique'",
                        String.class);
            } catch (Exception ignored) { /* index doesn't exist yet */ }

            boolean isV1 = currentDef != null && currentDef.contains("email IS NOT NULL");
            boolean absent = currentDef == null;

            if (!isV1 && !absent) {
                // Already at the correct version — idempotent restart behaviour.
                log.info("[Migration] users_email_role_active_unique already at v2 — skipping.");
                return;
            }

            // Pre-flight 1: detect (email, role) duplicates among active rows.
            List<Map<String, Object>> dupes = jdbcTemplate.queryForList(
                    "SELECT LOWER(email) AS email, role, COUNT(*) AS cnt " +
                    "FROM users WHERE account_status <> 'deleted' " +
                    "GROUP BY LOWER(email), role HAVING COUNT(*) > 1");
            if (!dupes.isEmpty()) {
                StringBuilder msg = new StringBuilder(
                        "[Migration] Duplicate (email, role) pairs found among active users — " +
                        "cannot create unique index. Resolve manually before redeploying. " +
                        "Offending entries: ");
                for (Map<String, Object> row : dupes) {
                    msg.append(row.get("email")).append(" / ").append(row.get("role"))
                       .append(" (count=").append(row.get("cnt")).append("), ");
                }
                throw new IllegalStateException(msg.toString());
            }

            // Pre-flight 2: confirm no active rows have a blank email.
            // The tighter v2 index covers ALL non-deleted rows; a blank-email active
            // row would mean our application guards have a gap.
            List<Map<String, Object>> blankEmails = jdbcTemplate.queryForList(
                    "SELECT uid FROM users WHERE (email IS NULL OR email = '') AND account_status <> 'deleted'");
            if (!blankEmails.isEmpty()) {
                StringBuilder uids = new StringBuilder();
                for (Map<String, Object> row : blankEmails) uids.append(row.get("uid")).append(", ");
                throw new IllegalStateException(
                        "[Migration] Active users with blank email found — cannot create v2 index. " +
                        "Clean up these UIDs first: " + uids);
            }

            // Drop v1 (or any remnant) and recreate with tighter predicate.
            // v1 escape clause "email IS NOT NULL AND email <> ''" let empty-email
            // rows slip through the constraint — the root cause of the duplicate bug.
            // v2 covers every non-deleted row so blank emails are now blocked at the DB.
            jdbcTemplate.execute("DROP INDEX IF EXISTS users_email_role_active_unique");
            jdbcTemplate.execute(
                    "CREATE UNIQUE INDEX users_email_role_active_unique " +
                    "ON users (LOWER(email), role) " +
                    "WHERE account_status <> 'deleted'");
            log.info("[Migration] users_email_role_active_unique {} (v2 — no email escape).",
                    isV1 ? "upgraded from v1" : "created fresh");
        } catch (IllegalStateException e) {
            throw e; // propagate so startup fails loudly
        } catch (Exception e) {
            log.error("[Migration] Could not recreate users_email_role_active_unique: {} — " +
                    "run manually: DROP INDEX IF EXISTS users_email_role_active_unique; " +
                    "CREATE UNIQUE INDEX users_email_role_active_unique ON users (LOWER(email), role) " +
                    "WHERE account_status <> 'deleted';",
                    e.getMessage(), e);
        }
    }

    // ── post-migration verification ───────────────────────────────────────────

    /**
     * Checks that the most critical columns exist after all migrations.
     * Logs a prominent ERROR with the manual SQL if a column is still missing.
     */
    private void verifyMigrations() {
        verifyColumnExists("users",  "account_status",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(255) NOT NULL DEFAULT 'active';");
        verifyColumnExists("users",  "wallet_balance",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DOUBLE PRECISION DEFAULT 0.0;");
        verifyColumnExists("users",  "favorites",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites TEXT DEFAULT '[]';");
        verifyColumnExists("orders", "items",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS items TEXT DEFAULT '[]';");
    }

    private void verifyColumnExists(String table, String column, String manualSql) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                    "WHERE table_name = ? AND column_name = ?",
                    Integer.class, table, column);
            if (count == null || count == 0) {
                log.error(
                    "[Migration] CRITICAL — {}.{} still missing after migration! " +
                    "Run this manually in Cloud SQL Studio: {}",
                    table, column, manualSql);
            } else {
                log.info("[Migration] OK: {}.{} verified.", table, column);
            }
        } catch (Exception e) {
            log.error("[Migration] Could not verify {}.{}: {}", table, column, e.getMessage(), e);
        }
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    /**
     * Checks the current data_type of [table].[column] in information_schema.
     * If it is not already 'text', runs ALTER TABLE … ALTER COLUMN … TYPE TEXT.
     * Safe to call repeatedly — skips silently when already TEXT.
     */
    private void alterToTextIfNeeded(String table, String column) {
        try {
            String dataType = jdbcTemplate.queryForObject(
                    "SELECT data_type FROM information_schema.columns " +
                    "WHERE table_name = ? AND column_name = ?",
                    String.class, table, column);

            if (dataType == null) {
                // column doesn't exist yet; addColumnIfMissing will handle it
                return;
            }
            if ("text".equalsIgnoreCase(dataType)) {
                log.debug("[Migration] {}.{} is already TEXT — skipping.", table, column);
            } else {
                jdbcTemplate.execute(
                        "ALTER TABLE " + table + " ALTER COLUMN " + column + " TYPE TEXT");
                log.info("[Migration] {}.{} widened from {} to TEXT.", table, column, dataType);
            }
        } catch (Exception e) {
            log.error("[Migration] Could not check/alter {}.{}: {} — run manually: " +
                "ALTER TABLE {} ALTER COLUMN {} TYPE TEXT;",
                table, column, e.getMessage(), table, column, e);
        }
    }

    /**
     * Adds [column] to [table] with the given type if it does not already exist.
     * Safe to call repeatedly — skips silently when the column is present.
     */
    private void addColumnIfMissing(String table, String column, String columnType) {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE " + table + " ADD COLUMN IF NOT EXISTS " + column + " " + columnType);
            log.debug("[Migration] Ensured {}.{} exists ({}).", table, column, columnType);
        } catch (Exception e) {
            log.error("[Migration] Could not add {}.{} — run manually: " +
                "ALTER TABLE {} ADD COLUMN IF NOT EXISTS {} {}; — cause: {}",
                table, column, table, column, columnType, e.getMessage(), e);
        }
    }
}
