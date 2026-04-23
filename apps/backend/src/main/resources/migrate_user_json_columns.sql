-- Run this once if the users table already existed before favorites/addresses were added.
-- Hibernate ddl-auto=update can fail to add columns that use DEFAULT with special characters.
-- This ensures both JSON-array columns exist and default to empty arrays.

ALTER TABLE users ADD COLUMN IF NOT EXISTS favorites TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS addresses TEXT DEFAULT '[]';

-- Backfill any NULLs so the application code never sees NULL for these columns.
UPDATE users SET favorites = '[]' WHERE favorites IS NULL;
UPDATE users SET addresses = '[]' WHERE addresses IS NULL;
