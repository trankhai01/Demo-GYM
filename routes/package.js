const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Xem danh sách gói
router.get('/', (req, res) => {
    db.query("SELECT * FROM packages ORDER BY price ASC", (err, results) => {
        if (err) return res.status(500).send("Lỗi server");
        res.render('packages/index', { packages: results || [] });
    });
});

// 2. Giao diện Thêm gói
router.get('/add', (req, res) => {
    res.render('packages/add');
});

// 3. Xử lý Thêm gói
router.post('/add', (req, res) => {
    const { package_name, duration_months, price } = req.body;
    db.query("INSERT INTO packages (package_name, duration_months, price) VALUES (?, ?, ?)", 
    [package_name, duration_months, price], (err, result) => {
        if (err) return res.status(500).send("Lỗi thêm dữ liệu");
        res.redirect('/packages');
    });
});

// 4. Giao diện Sửa gói
router.get('/edit/:id', (req, res) => {
    db.query("SELECT * FROM packages WHERE id = ?", [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/packages');
        res.render('packages/edit', { pkg: result[0] });
    });
});

// 5. Xử lý Sửa gói
router.post('/edit/:id', (req, res) => {
    const { package_name, duration_months, price } = req.body;
    db.query("UPDATE packages SET package_name = ?, duration_months = ?, price = ? WHERE id = ?", 
    [package_name, duration_months, price, req.params.id], (err, result) => {
        if (err) return res.status(500).send("Lỗi cập nhật dữ liệu");
        res.redirect('/packages');
    });
});

// 6. Xử lý Xóa gói (Có bảo vệ khóa ngoại)
router.get('/delete/:id', (req, res) => {
    db.query("DELETE FROM packages WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.send("<script>alert('KHÔNG THỂ XÓA! Đang có hội viên sử dụng gói tập này.'); window.location='/packages';</script>");
            }
            return res.status(500).send("Lỗi hệ thống");
        }
        res.redirect('/packages');
    });
});

module.exports = router;