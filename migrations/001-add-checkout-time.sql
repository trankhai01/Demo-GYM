-- Migration 001: thêm cột checkout_time vào bảng checkin_history.
-- Áp dụng cho database đã tồn tại trước khi tính năng check-out được thêm.
--
-- Idempotent: dùng INFORMATION_SCHEMA + dynamic SQL để bỏ qua khi cột/index
-- đã tồn tại — chạy nhiều lần hoặc trên DB mới (đã chạy schema.sql) đều không lỗi.
--
-- Chạy:
--   mysql -u <user> -p <db_name> < migrations/001-add-checkout-time.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS migrate_001_add_checkout_time$$
CREATE PROCEDURE migrate_001_add_checkout_time()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'checkin_history'
          AND COLUMN_NAME  = 'checkout_time'
    ) THEN
        ALTER TABLE checkin_history
            ADD COLUMN checkout_time DATETIME NULL AFTER checkin_time;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'checkin_history'
          AND INDEX_NAME   = 'idx_ck_open_session'
    ) THEN
        ALTER TABLE checkin_history
            ADD INDEX idx_ck_open_session (member_id, checkout_time);
    END IF;
END$$

DELIMITER ;

CALL migrate_001_add_checkout_time();
DROP PROCEDURE migrate_001_add_checkout_time;
