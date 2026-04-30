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
    gender       VARCHAR(10)  DEFAULT 'Nam',
    join_date    DATE         NOT NULL,
    password     VARCHAR(255) NOT NULL,
    role         ENUM('admin', 'staff', 'member') NOT NULL DEFAULT 'member',
    cccd         VARCHAR(20),
    birth_year   INT,
    height       DECIMAL(5,2),
    weight       DECIMAL(5,2),
    hometown     VARCHAR(100),
    address      VARCHAR(255),
    avatar_url   VARCHAR(500),
    INDEX idx_members_phone (phone)
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
CREATE TABLE IF NOT EXISTS registrations (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    member_id          INT,
    package_id         INT,
    trainer_id         INT,
    price              DECIMAL(12,2) NOT NULL DEFAULT 0,
    registration_date  DATE NOT NULL,
    expiration_date    DATE,
    schedule           VARCHAR(255),
    total_sessions     INT DEFAULT 0,
    used_sessions      INT DEFAULT 0,
    payment_status     ENUM('Pending', 'Success') DEFAULT 'Pending',
    payment_method     VARCHAR(50)  DEFAULT 'Tiền mặt',
    status             VARCHAR(20)  DEFAULT 'active',
    CONSTRAINT fk_reg_member  FOREIGN KEY (member_id)  REFERENCES members(id)  ON DELETE SET NULL,
    CONSTRAINT fk_reg_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reg_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL,
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
