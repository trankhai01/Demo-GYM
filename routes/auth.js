const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// 1. Giao diện Login
router.get('/login', (req, res) => {
    res.render('login');
});

// 2. Xử lý Đăng nhập
router.post('/login', (req, res) => {
    const { phone, password } = req.body;
    
    // Tìm user theo số điện thoại
    const sql = "SELECT * FROM members WHERE phone = ?";
    db.query(sql, [phone], async (err, results) => {
        if (err) return res.status(500).send("Lỗi server");

        if (results.length > 0) {
            const user = results[0];

            // KIỂM TRA MẬT KHẨU
            let isMatch = false;
            if (user.password.startsWith('$2b$')) {
                // Nếu mật khẩu đã mã hóa (bcrypt), dùng compare
                isMatch = await bcrypt.compare(password, user.password);
            } else {
                // Nếu mật khẩu cũ là text thuần (như 123456 trong ảnh của bạn)
                isMatch = (password === user.password);
            }

            if (isMatch) {
                // Lưu session (Dùng fullname để hiển thị ở góc nhỏ)
                req.session.user = { 
                    id: user.id, 
                    username: user.fullname, 
                    role: user.role 
                };

                // Phân quyền chuyển hướng
                if (user.role === 'admin') {
                    res.redirect('/reports/revenue'); // Admin thì cho xem doanh thu cho "oai"
                } else {
                    res.redirect('/'); // Member về trang chủ
                }
            } else {
                res.send("<h1>Sai mật khẩu!</h1><a href='/login'>Quay lại</a>");
            }
        } else {
            res.send("<h1>Số điện thoại không tồn tại!</h1><a href='/login'>Quay lại</a>");
        }
    });
});

// 3. Giao diện Đăng ký
router.get('/register', (req, res) => {
    res.render('register');
});

// 4. Xử lý Đăng ký
router.post('/register', async (req, res) => {
    // Đổi username thành fullname cho khớp DB của bạn
    const { fullname, phone, password, gender } = req.body;
    const join_date = new Date().toISOString().split('T')[0];

    try {
        // Mã hóa mật khẩu để bảo mật
        const hashedPassword = await bcrypt.hash(password, 10);

        // Dùng đúng tên cột: fullname, phone, gender, join_date, password, role
        const sql = "INSERT INTO members (fullname, phone, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, 'member')";
        
        db.query(sql, [fullname, phone, gender || 'Nam', join_date, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.send("Số điện thoại này đã được đăng ký!");
                }
                console.error(err);
                return res.status(500).send("Lỗi Database");
            }
            res.redirect('/login');
        });
    } catch (error) {
        res.status(500).send("Lỗi hệ thống");
    }
});

// 5. Đăng xuất
router.get('/logout', (req, res) => {
    req.session.destroy(); 
    res.redirect('/'); 
});

module.exports = router;