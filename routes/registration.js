const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Trang đăng ký (Chọn hội viên và chọn gói)
router.get('/add', (req, res) => {
    // Lấy đồng thời cả danh sách hội viên và gói tập
    const sqlMembers = "SELECT * FROM members";
    const sqlPackages = "SELECT * FROM packages";

    db.query(sqlMembers, (err, members) => {
        db.query(sqlPackages, (err, packages) => {
            res.render('registrations/add', { members, packages });
        });
    });
});

// Xử lý lưu đăng ký
router.post('/add', (req, res) => {
    const { member_id, package_id } = req.body;

    // 1. Tìm xem gói tập đó có bao nhiêu ngày
    db.query("SELECT duration_days FROM packages WHERE id = ?", [package_id], (err, result) => {
        const days = result[0].duration_days;

        // 2. Tính ngày hết hạn (NodeJS Date)
        let expDate = new Date();
        expDate.setDate(expDate.getDate() + days);

        // 3. Lưu vào bảng registrations
        const sql = "INSERT INTO registrations (member_id, package_id, expiration_date, status) VALUES (?, ?, ?, 'Active')";
        db.query(sql, [member_id, package_id, expDate], (err) => {
            if (err) throw err;
            res.redirect('/members'); // Đăng ký xong về trang hội viên
        });
    });
});

module.exports = router;