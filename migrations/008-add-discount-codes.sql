-- Mã ưu đãi (promo code) cho gói tập.
-- Hỗ trợ giảm theo % hoặc giảm theo số tiền cố định, áp cho cả hóa đơn POS.

CREATE TABLE IF NOT EXISTS discount_codes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(40)  NOT NULL UNIQUE,
    description     VARCHAR(255),
    discount_type   ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
    discount_value  DECIMAL(12,2) NOT NULL,
    min_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
    max_discount    DECIMAL(12,2) NULL,
    valid_from      DATE NULL,
    valid_to        DATE NULL,
    usage_limit     INT NULL,
    used_count      INT NOT NULL DEFAULT 0,
    is_birthday     TINYINT(1) NOT NULL DEFAULT 0,
    member_id       INT NULL,
    status          ENUM('active','disabled') NOT NULL DEFAULT 'active',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dc_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_dc_status_dates (status, valid_from, valid_to),
    INDEX idx_dc_member (member_id)
) ENGINE=InnoDB;

-- Cột lưu mã đã dùng + tiền giảm trên từng hóa đơn registrations.
SET @c1 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrations'
              AND COLUMN_NAME = 'discount_code_id');
SET @sql := IF(@c1 = 0,
    'ALTER TABLE registrations ADD COLUMN discount_code_id INT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @c2 := (SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrations'
              AND COLUMN_NAME = 'discount_amount');
SET @sql := IF(@c2 = 0,
    'ALTER TABLE registrations ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrations'
              AND COLUMN_NAME = 'discount_code_id' AND REFERENCED_TABLE_NAME = 'discount_codes');
SET @sql := IF(@fk = 0,
    'ALTER TABLE registrations ADD CONSTRAINT fk_reg_discount FOREIGN KEY (discount_code_id) REFERENCES discount_codes(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
