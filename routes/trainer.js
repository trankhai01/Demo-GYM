const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Danh sách PT
router.get('/', (req, res) => {
    db.query("SELECT * FROM trainers ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).send("Lỗi server");
        res.render('trainers/index', { trainers: results || [] });
    });
});

// 2. Giao diện Thêm
router.get('/add', (req, res) => {
    res.render('trainers/add');
});

// 3. Xử lý Thêm
router.post('/add', (req, res) => {
    const { fullname, phone, specialty, experience_years, image_url, description } = req.body;
    db.query("INSERT INTO trainers (fullname, phone, specialty, experience_years, image_url, description) VALUES (?, ?, ?, ?, ?, ?)", 
    [fullname, phone, specialty, experience_years, image_url, description], (err) => {
        if (err) return res.status(500).send("Lỗi thêm dữ liệu");
        res.redirect('/trainers');
    });
});

// 4. Giao diện Sửa
router.get('/edit/:id', (req, res) => {
    db.query("SELECT * FROM trainers WHERE id = ?", [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/trainers');
        res.render('trainers/edit', { trainer: result[0] });
    });
});

// 5. Xử lý Sửa
router.post('/edit/:id', (req, res) => {
    const { fullname, phone, specialty, experience_years, image_url, description, status } = req.body;
    db.query("UPDATE trainers SET fullname=?, phone=?, specialty=?, experience_years=?, image_url=?, description=?, status=? WHERE id=?", 
    [fullname, phone, specialty, experience_years, image_url, description, status, req.params.id], (err) => {
        if (err) return res.status(500).send("Lỗi cập nhật dữ liệu");
        res.redirect('/trainers');
    });
});

// 6. Xóa PT 
router.get('/delete/:id', (req, res) => {
    db.query("DELETE FROM trainers WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.send("<script>alert('Không thể xóa PT đang có lịch dạy!'); window.location='/trainers';</script>");
        res.redirect('/trainers');
    });
});

module.exports = router;