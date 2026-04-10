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
 * column types (e.g. VARCHAR → TEXT). This runner fills that gap for cases where
 * the column was created before the @Column(columnDefinition="TEXT") annotation
 * was added to the entity.
 */
@Component
@RequiredArgsConstructor
public class DatabaseMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        alterToTextIfNeeded("stores", "logo");
    }

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

            if ("text".equalsIgnoreCase(dataType)) {
                log.debug("[Migration] {}.{} is already TEXT — skipping.", table, column);
            } else {
                jdbcTemplate.execute(
                        "ALTER TABLE " + table + " ALTER COLUMN " + column + " TYPE TEXT");
                log.info("[Migration] {}.{} widened from {} to TEXT.", table, column, dataType);
            }
        } catch (Exception e) {
            log.warn("[Migration] Could not check/alter {}.{}: {}", table, column, e.getMessage());
        }
    }
}
