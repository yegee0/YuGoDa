-- Run this once against your PostgreSQL database if the users table already existed
-- before these columns were added to the User entity.
-- Hibernate ddl-auto=update will NOT add NOT NULL columns to existing tables
-- (adding a NOT NULL column with no DEFAULT fails on tables with existing rows).
-- All statements use IF NOT EXISTS so they are safe to run repeatedly.

-- Core profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status    VARCHAR(255) NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name      VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name        VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name         VARCHAR(255);

-- Wallet / locale
ALTER TABLE users ADD COLUMN IF NOT EXISTS language          VARCHAR(255) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance    DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code      VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number     VARCHAR(255);

-- Preferences / push
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language    VARCHAR(255) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token             VARCHAR(255);

-- photo_url is handled separately by DatabaseMigrationRunner (VARCHAR → TEXT widen)
