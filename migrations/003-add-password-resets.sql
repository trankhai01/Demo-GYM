-- Migration 003: bảng password_reset_requests cho luồng "Quên mật khẩu".
-- Hội viên gửi yêu cầu reset → admin duyệt và sinh mật khẩu tạm thời mới.
-- Idempotent: dùng CREATE TABLE IF NOT EXISTS — chạy nhiều lần đều OK.
--
-- Chạy:
--   mysql -u <user> -p <db_name> < migrations/003-add-password-resets.sql

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
