-- Schema cho Demo-GYM (suy luận từ các câu truy vấn trong routes/).
-- Chạy lần đầu: tạo database `quan_ly_gym`, sau đó `mysql -u root quan_ly_gym < schema.sql`.

CREATE DATABASE IF NOT EXISTS quan_ly_gym
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;
USE quan_ly_gym;

-- ---------------------------------------------------------------------------
-- members: hội viên + tài khoản đăng nhập (admin/staff/member dùng chung bảng)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    fullname     VARCHAR(100) NOT NULL,
    phone        VARCHAR(20)  NOT NULL UNIQUE,
    email        VARCHAR(120) NULL,
    gender       VARCHAR(10)  DEFAULT 'Nam',
    join_date    DATE         NOT NULL,
    password     VARCHAR(255) NOT NULL,
    role         ENUM('admin', 'staff', 'member') NOT NULL DEFAULT 'member',
    cccd         VARCHAR(20),
    birth_year   INT,
    birth_date   DATE NULL,
    height       DECIMAL(5,2),
    weight       DECIMAL(5,2),
    hometown     VARCHAR(100),
    address      VARCHAR(255),
    avatar_url   VARCHAR(500),
    INDEX idx_members_phone (phone),
    INDEX idx_members_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- packages: gói tập
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    package_name     VARCHAR(100)   NOT NULL,
    duration_months  INT            NOT NULL,
    price            DECIMAL(12,2)  NOT NULL,
    description      TEXT,
    pt_sessions      INT            NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- trainers: huấn luyện viên cá nhân
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainers (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    fullname          VARCHAR(100) NOT NULL,
    phone             VARCHAR(20),
    specialty         VARCHAR(100),
    experience_years  INT DEFAULT 0,
    image_url         VARCHAR(500),
    description       TEXT,
    status            VARCHAR(20) DEFAULT 'Active'
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- products: kho hàng (đồ uống/phụ kiện) bán kèm tại quầy
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    product_name    VARCHAR(150)  NOT NULL,
    category        VARCHAR(50),
    price           DECIMAL(12,2) NOT NULL,
    stock_quantity  INT           NOT NULL DEFAULT 0,
    image_url       VARCHAR(500),
    status          VARCHAR(20)   DEFAULT 'Active',
    INDEX idx_products_category_stock (category, stock_quantity)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- registrations: hóa đơn / đăng ký gói (kiêm cả POS)
-- ---------------------------------------------------------------------------
-- Lưu ý: registrations chỉ chứa thông tin gói + thanh toán. HLV của
-- từng buổi tập được ghi tại bookings (đặt lịch) hoặc pt_sessions_log
-- (lúc điểm danh trừ buổi). Lịch tập thật cũng nằm tại bookings.
CREATE TABLE IF NOT EXISTS registrations (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    member_id          INT,
    package_id         INT,
    price              DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_code_id   INT NULL,
    discount_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    registration_date  DATE NOT NULL,
    expiration_date    DATE,
    total_sessions     INT DEFAULT 0,
    used_sessions      INT DEFAULT 0,
    payment_status     ENUM('Pending', 'Success') DEFAULT 'Pending',
    payment_method     VARCHAR(50)  DEFAULT 'Tiền mặt',
    status             VARCHAR(20)  DEFAULT 'active',
    upgrade_from_registration_id INT NULL,
    upgrade_credit_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    upgrade_total_days INT NULL,
    upgrade_days_remaining INT NULL,
    CONSTRAINT fk_reg_member  FOREIGN KEY (member_id)  REFERENCES members(id)  ON DELETE SET NULL,
    CONSTRAINT fk_reg_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reg_upgrade_from FOREIGN KEY (upgrade_from_registration_id) REFERENCES registrations(id) ON DELETE SET NULL,
    INDEX idx_reg_member_status (member_id, status, expiration_date),
    INDEX idx_reg_payment_date  (payment_status, registration_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- registration_details: chi tiết sản phẩm trong 1 hóa đơn POS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registration_details (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    product_id      INT NOT NULL,
    quantity        INT NOT NULL,
    price           DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_rd_reg     FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rd_product FOREIGN KEY (product_id)      REFERENCES products(id)      ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- payos_payments: lưu payment link/QR payOS cho hóa đơn tự đăng ký
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payos_payments (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    order_code      BIGINT NOT NULL UNIQUE,
    payment_link_id VARCHAR(80) NULL,
    checkout_url    TEXT NULL,
    qr_code         TEXT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    raw_response    LONGTEXT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payos_registration (registration_id),
    CONSTRAINT fk_payos_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- checkin_history: lịch sử check-in của hội viên
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checkin_history (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    member_id     INT NOT NULL,
    checkin_time  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checkout_time DATETIME NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'Success',
    note          VARCHAR(255),
    CONSTRAINT fk_ck_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_ck_member_time (member_id, checkin_time),
    INDEX idx_ck_open_session (member_id, checkout_time)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- bookings: lịch tập do hội viên đặt trước (calendar)
-- Mỗi row là 1 buổi tập member dự định đến phòng (có thể kèm HLV)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    member_id   INT NOT NULL,
    trainer_id  INT NULL,
    start_time  DATETIME NOT NULL,
    end_time    DATETIME NOT NULL,
    title       VARCHAR(120) NOT NULL DEFAULT 'Buổi tập',
    note        VARCHAR(255),
    status      VARCHAR(20) NOT NULL DEFAULT 'booked',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bk_member  FOREIGN KEY (member_id)  REFERENCES members(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bk_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL,
    INDEX idx_bk_member_time  (member_id,  start_time),
    INDEX idx_bk_trainer_time (trainer_id, start_time),
    INDEX idx_bk_status_time  (status,     start_time)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- password_reset_requests: yêu cầu quên mật khẩu — admin sẽ duyệt và sinh
-- mật khẩu tạm thời cho hội viên
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_requests (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    member_id     INT NOT NULL,
    requested_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | resolved | dismissed
    resolved_at   DATETIME NULL,
    resolved_by   INT NULL,
    note          VARCHAR(255) NULL,
    CONSTRAINT fk_prr_member   FOREIGN KEY (member_id)   REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_prr_resolver FOREIGN KEY (resolved_by) REFERENCES members(id) ON DELETE SET NULL,
    INDEX idx_prr_status_time (status, requested_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- password_otp: mã OTP xác thực quên mật khẩu (hết hạn sau 5 phút)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_otp (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    member_id    INT NOT NULL,
    otp_code     VARCHAR(6) NOT NULL,
    expires_at   DATETIME NOT NULL,
    verified     TINYINT(1) NOT NULL DEFAULT 0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_otp_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_otp_member (member_id),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- contact_messages: form Liên hệ trên landing page
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    fullname     VARCHAR(150) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    phone        VARCHAR(30)  NULL,
    subject      VARCHAR(255) NULL,
    message      TEXT         NOT NULL,
    is_read      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_messages_created (created_at DESC),
    INDEX idx_contact_messages_unread (is_read, created_at DESC)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- pt_sessions_log: lịch sử trừ buổi PT
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pt_sessions_log (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    member_id       INT NOT NULL,
    trainer_id      INT,
    note            VARCHAR(255),
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pt_reg     FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_member  FOREIGN KEY (member_id)       REFERENCES members(id)       ON DELETE CASCADE,
    CONSTRAINT fk_pt_trainer FOREIGN KEY (trainer_id)      REFERENCES trainers(id)      ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Tài khoản admin mặc định (mật khẩu: "admin123" — ĐỔI NGAY sau khi cài).
-- Hash bcrypt cho "admin123":
INSERT INTO members (fullname, phone, gender, join_date, password, role)
VALUES ('Admin', '0000000000', 'Nam', CURRENT_DATE(),
        '$2b$10$4XRENkLwBycjiRh.OftxquEWK0odXZ7Vw65SuQeuXUIsaYSHw4uMy', 'admin')
ON DUPLICATE KEY UPDATE fullname = fullname;

-- ---------------------------------------------------------------------------
-- discount_codes: mã ưu đãi áp cho hóa đơn (lễ Tết, sinh nhật hội viên...)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- audit_logs: nhật ký thao tác nhạy cảm của admin/staff
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id     INT NULL,
    actor_name   VARCHAR(100) NULL,
    actor_role   VARCHAR(20) NULL,
    action       VARCHAR(80) NOT NULL,
    entity_type  VARCHAR(80) NOT NULL,
    entity_id    VARCHAR(80) NULL,
    metadata     JSON NULL,
    ip_address   VARCHAR(64) NULL,
    user_agent   VARCHAR(255) NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_actor_time (actor_id, created_at),
    INDEX idx_audit_entity_time (entity_type, entity_id, created_at),
    INDEX idx_audit_action_time (action, created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- system_settings: cấu hình hiển thị của phòng gym
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key   VARCHAR(80) PRIMARY KEY,
    setting_value TEXT NULL,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES
('gym_name', 'GYM BRO'),
('hotline', '0900 000 000'),
('zalo_phone', '0900000000'),
('email', 'hello@gymbro.vn'),
('address', 'Quận 1, TP. Hồ Chí Minh'),
('opening_hours', '05:00 - 22:00 mỗi ngày'),
('bank_bin', 'mbbank'),
('bank_account', '0866108697'),
('bank_account_name', 'GYM BRO'),
('map_embed_url', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.434088447635!2d106.6983107!3d10.776530892315796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e9d%3A0xb8b7460491acdd84!2zUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaA!5e0!3m2!1svi!2s!4v1700000000000');
