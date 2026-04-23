-- Run this once against your PostgreSQL database if the users table already exists.
-- Hibernate ddl-auto=update will NOT widen VARCHAR(255) to TEXT automatically.
-- This migration widens photo_url so it can hold base64-encoded images.

ALTER TABLE users ALTER COLUMN photo_url TYPE TEXT;
