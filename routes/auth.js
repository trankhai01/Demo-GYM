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
    const sql = "SELECT * FROM members WHERE phone = ?";
    db.query(sql, [phone], async (err, results) => {
        if (err) return res.status(500).send("Lỗi server");

        if (results.length > 0) {
            const user = results[0];
            let isMatch = false;
            if (user.password.startsWith('$2b$')) {
                isMatch = await bcrypt.compare(password, user.password);
            } else {
                isMatch = (password === user.password);
            }
            if (isMatch) {
                req.session.user = { 
                    id: user.id, 
                    username: user.fullname, 
                    role: user.role 
                };
                
                req.session.save((err) => {
                    if(err) console.error("Lỗi lưu session", err);
                    res.redirect('/'); 
                });
            } else {
                res.render('login', { 
                    error: 'Sai mật khẩu! Vui lòng thử lại.',
                    phone: phone 
                });
            }
        } else {
            res.render('login', { 
                error: 'Số điện thoại không tồn tại trên hệ thống!',
                phone: phone
            });
        }
    });
});

// 3. Giao diện Đăng ký
router.get('/register', (req, res) => {
    res.render('register');
});

// 4. Xử lý Đăng ký
router.post('/register', async (req, res) => {
    const { fullname, phone, password, gender } = req.body;
    const join_date = new Date().toISOString().split('T')[0];

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
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