const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Hiển thị trang Login
router.get('/login', (req, res) => {
    res.render('login');
});

// 2. Xử lý khi bấm nút Đăng nhập
router.post('/login', (req, res) => {
    const { phone, password } = req.body;
    
    // Tìm user trong Database
    const sql = "SELECT * FROM members WHERE phone = ? AND password = ?";
    db.query(sql, [phone, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            // Đăng nhập đúng -> Lưu toàn bộ thông tin người đó vào Session
            req.session.user = results[0];

            // Phân quyền chuyển hướng
            if (results[0].role === 'admin') {
                res.redirect('/members'); // Admin vào xem danh sách hội viên
            } else {
                res.redirect('/my-profile'); // Khách hàng vào trang cá nhân (mình sẽ làm sau)
            }
        } else {
            // Đăng nhập sai
            res.send("<h1>Sai số điện thoại hoặc mật khẩu!</h1><a href='/login'>Quay lại</a>");
        }
    });
});

// 3. Xử lý Đăng xuất
router.get('/logout', (req, res) => {
    req.session.destroy(); // Xóa phiên đăng nhập
    res.redirect('/login'); // Đẩy về trang đăng nhập
});

module.exports = router;