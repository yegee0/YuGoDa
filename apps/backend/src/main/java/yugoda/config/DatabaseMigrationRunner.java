package yugoda.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

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
