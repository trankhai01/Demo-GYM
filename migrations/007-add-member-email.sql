-- Thêm cột email cho members để gửi mail reset mật khẩu.
-- Idempotent: chỉ thêm cột nếu chưa tồn tại.

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'members'
      AND COLUMN_NAME = 'email'
);

SET @sql := IF(@col_exists = 0,
    'ALTER TABLE members ADD COLUMN email VARCHAR(120) NULL AFTER phone',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'members'
      AND INDEX_NAME = 'idx_members_email'
);

SET @sql := IF(@idx_exists = 0,
    'CREATE INDEX idx_members_email ON members(email)',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
