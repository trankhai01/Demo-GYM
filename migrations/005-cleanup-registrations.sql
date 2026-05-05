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

-- 1) Tìm + drop MỌI foreign key đang reference cột trainer_id (tên FK
--    trên các DB khác nhau có thể khác nhau: fk_reg_trainer, registrations_ibfk_X,
--    hoặc tên auto-gen khác). Phải drop FK trước khi drop column.
SET @fk_name := (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'registrations'
      AND COLUMN_NAME = 'trainer_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);
SET @sql := IF(@fk_name IS NOT NULL,
    CONCAT('ALTER TABLE registrations DROP FOREIGN KEY `', @fk_name, '`'),
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Drop index trên trainer_id (nếu còn). Một số phiên bản MySQL/MariaDB
--    tự tạo index khi định nghĩa FK và KHÔNG tự gỡ khi drop FK → cần drop
--    rõ ràng để DROP COLUMN không lỗi #1553.
SET @idx_name := (
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'registrations'
      AND COLUMN_NAME = 'trainer_id'
    LIMIT 1
);
SET @sql := IF(@idx_name IS NOT NULL,
    CONCAT('ALTER TABLE registrations DROP INDEX `', @idx_name, '`'),
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Drop column trainer_id (nếu còn).
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

-- 4) Drop column schedule (nếu còn).
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
