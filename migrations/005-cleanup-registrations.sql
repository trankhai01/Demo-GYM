-- Migration 005: dọn cột thừa khỏi registrations.
-- Lý do: trainer_id + schedule trong registrations là 2 field "ma" — ghi
-- nhưng không có ràng buộc nào dùng đến. Hội viên đặt lịch qua bảng
-- bookings (chọn HLV + giờ thật), trừ buổi PT cũng nhận trainer_id từ
-- form điểm danh. Giữ 2 cột này vừa lãng phí storage vừa gây mâu thuẫn
-- (member đăng ký với HLV X nhưng tập với HLV Y → log sai HLV).
--
-- Idempotent guard: kiểm tra cột tồn tại trước khi drop để chạy nhiều lần
-- không lỗi. MySQL không có "DROP COLUMN IF EXISTS" trên phiên bản cũ
-- nên dùng information_schema + prepared statement.
--
-- Chạy:
--   mysql -u <user> -p <db_name> < migrations/005-cleanup-registrations.sql

-- 1) Drop foreign key fk_reg_trainer (nếu còn) — phải drop FK trước khi drop column.
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'registrations'
      AND CONSTRAINT_NAME = 'fk_reg_trainer'
);
SET @sql := IF(@fk_exists > 0,
    'ALTER TABLE registrations DROP FOREIGN KEY fk_reg_trainer',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Drop column trainer_id (nếu còn).
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'registrations'
      AND COLUMN_NAME = 'trainer_id'
);
SET @sql := IF(@col_exists > 0,
    'ALTER TABLE registrations DROP COLUMN trainer_id',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Drop column schedule (nếu còn).
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'registrations'
      AND COLUMN_NAME = 'schedule'
);
SET @sql := IF(@col_exists > 0,
    'ALTER TABLE registrations DROP COLUMN schedule',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
