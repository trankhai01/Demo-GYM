-- Migration 002: thêm bảng bookings (lịch tập đặt trước qua calendar).
-- Idempotent: dùng CREATE TABLE IF NOT EXISTS — chạy nhiều lần đều OK.
--
-- Chạy:
--   mysql -u <user> -p <db_name> < migrations/002-add-bookings.sql

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
