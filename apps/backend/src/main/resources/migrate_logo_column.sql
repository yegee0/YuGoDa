-- Run this once against your PostgreSQL database if the stores table already exists.
-- Hibernate ddl-auto=update will NOT widen VARCHAR(255) to TEXT automatically.
-- This migration widens the logo column so it can hold base64-encoded images.

ALTER TABLE stores ALTER COLUMN logo TYPE TEXT;
