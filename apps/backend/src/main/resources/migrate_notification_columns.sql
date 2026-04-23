-- Run this once if the notifications table already existed before titleKey/messageKey/orderId were added.
-- Hibernate ddl-auto=update can fail to add columns when the DB user lacks DDL permissions.
-- These columns are required by OrderService.updateStatus to save status-change notifications.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title_key VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message_key VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS order_id VARCHAR(255);
