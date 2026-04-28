-- Soft-delete fields for KVKK/GDPR account deletion.
-- All statements use IF NOT EXISTS so this file is safe to run repeatedly.
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted  BOOLEAN      NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP;
