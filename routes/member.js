const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Kết nối tới file db.js đã tạo

// Lấy danh sách hội viên
router.get('/', (req, res) => {
    const sql = "SELECT * FROM members ORDER BY id DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send("Lỗi truy vấn: " + err.message);
        }
        // Trả dữ liệu về file views/members/index.ejs
        res.render('members/index', { members: results });
    });
});
// ... (giữ nguyên phần code cũ)

// 1. Trang hiển thị Form thêm hội viên
router.get('/add', (req, res) => {
    res.render('members/add');
});

// 2. Xử lý dữ liệu từ Form gửi lên
router.post('/add', (req, res) => {
    const { fullname, phone, gender } = req.body;
    const sql = "INSERT INTO members (fullname, phone, gender) VALUES (?, ?, ?)";
    
    db.query(sql, [fullname, phone, gender], (err, result) => {
        if (err) {
            return res.status(500).send("Lỗi khi thêm hội viên: " + err.message);
        }
        // Thêm xong thì quay về trang danh sách
        res.redirect('/members');
    });
});

module.exports = router;