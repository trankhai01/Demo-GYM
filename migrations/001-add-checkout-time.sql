-- Migration 001: thêm cột checkout_time vào bảng checkin_history.
-- Áp dụng cho database đã tồn tại trước khi tính năng check-out được thêm.
-- Idempotent: chạy nhiều lần vẫn an toàn (báo lỗi cột đã tồn tại — bỏ qua).
--
-- Cách chạy:
--   mysql -u <user> -p <db_name> < migrations/001-add-checkout-time.sql

USE quan_ly_gym;

ALTER TABLE checkin_history
    ADD COLUMN checkout_time DATETIME NULL AFTER checkin_time;

ALTER TABLE checkin_history
    ADD INDEX idx_ck_open_session (member_id, checkout_time);
