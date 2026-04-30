-- Migration 004: thêm cột avatar_url cho hội viên (chứa đường dẫn ảnh đại diện
-- đã upload, vd /uploads/avatars/abc123.jpg). Dùng IF NOT EXISTS pattern qua
-- INFORMATION_SCHEMA để chạy nhiều lần đều OK (MySQL/MariaDB chưa hỗ trợ
-- ALTER TABLE ADD COLUMN IF NOT EXISTS native trên mọi version).
--
-- Chạy:
--   mysql -u <user> -p <db_name> < migrations/004-add-member-avatar.sql

SET @col_exists := (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'members'
      AND COLUMN_NAME = 'avatar_url'
);

SET @ddl := IF(@col_exists = 0,
    'ALTER TABLE members ADD COLUMN avatar_url VARCHAR(500) NULL',
    'SELECT ''avatar_url already exists, skipped'' AS info'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
