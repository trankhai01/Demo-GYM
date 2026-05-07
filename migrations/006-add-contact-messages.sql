-- Migration 006: bảng contact_messages — lưu form Liên hệ từ landing page.
-- Khách (chưa login) gửi form trên home → INSERT vào bảng này. Admin/staff
-- xem ở /admin/messages, đánh dấu đã đọc, hoặc xóa.
--
-- Idempotent: dùng IF NOT EXISTS, có thể chạy lại nhiều lần.
--
-- Chạy:
--   mysql -u <user> -p <db_name> < migrations/006-add-contact-messages.sql

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    subject VARCHAR(255) NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_messages_created (created_at DESC),
    INDEX idx_contact_messages_unread (is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
