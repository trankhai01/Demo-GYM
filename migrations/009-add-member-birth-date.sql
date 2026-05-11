-- 009: Thêm cột ngày sinh đầy đủ cho hội viên
-- (cột birth_year hiện chỉ lưu năm → không filter được "sinh nhật trong tháng này")
ALTER TABLE members ADD COLUMN birth_date DATE NULL AFTER birth_year;

-- Backfill: với các hàng đang có birth_year mà chưa có birth_date, gán mặc định 01/01/<năm>
UPDATE members
SET birth_date = STR_TO_DATE(CONCAT(birth_year, '-01-01'), '%Y-%m-%d')
WHERE birth_year IS NOT NULL AND birth_date IS NULL;
