const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// Brute-force protection on login: 10 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
});

// 1. Giao diện Login — nếu đã đăng nhập thì về trang chủ
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login');
});

// 2. Xử lý đăng nhập
router.post('/login', loginLimiter, (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.render('login', { 
            error: 'Vui lòng nhập số điện thoại và mật khẩu!',
            phone 
        });
    }

    const sql = "SELECT * FROM members WHERE phone = ?";
    db.query(sql, [phone], async (err, results) => {
        if (err) return res.status(500).render('error', { message: 'Lỗi server, vui lòng thử lại.' });

        if (results.length === 0) {
            return res.render('login', { 
                error: 'Số điện thoại không tồn tại trên hệ thống!',
                phone 
            });
        }

        const user = results[0];
        let isMatch = false;

        try {
            if (user.password.startsWith('$2b$')) {
                isMatch = await bcrypt.compare(password, user.password);
            } else {
                isMatch = (password === user.password);
                if (isMatch) {
                    const hashed = await bcrypt.hash(password, 10);
                    db.query("UPDATE members SET password = ? WHERE id = ?", [hashed, user.id]);
                }
            }
        } catch (e) {
            return res.status(500).render('error', { message: 'Lỗi xác thực, vui lòng thử lại.' });
        }

        if (!isMatch) {
            return res.render('login', { 
                error: 'Sai mật khẩu! Vui lòng thử lại.',
                phone 
            });
        }

        req.session.user = { 
            id: user.id, 
            username: user.fullname, 
            role: user.role 
        };

        req.session.save((err) => {
            if (err) console.error('Lỗi lưu session:', err);
            res.redirect('/');
        });
    });
});

// 3. Giao diện đăng ký
router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register');
});

// 4. Xử lý đăng ký
router.post('/register', async (req, res) => {
    const { fullname, phone, password, gender } = req.body;

    if (!fullname || !phone || !password) {
        return res.render('register', { 
            error: 'Vui lòng điền đầy đủ thông tin!',
            fullname, phone, gender
        });
    }

    const join_date = new Date().toISOString().split('T')[0];

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO members (fullname, phone, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, 'member')";
        
        db.query(sql, [fullname, phone, gender || 'Nam', join_date, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.render('register', { 
                        error: 'Số điện thoại này đã được đăng ký!',
                        fullname, phone, gender
                    });
                }
                console.error(err);
                return res.status(500).render('error', { message: 'Lỗi hệ thống, vui lòng thử lại.' });
            }
            res.redirect('/login');
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Lỗi hệ thống, vui lòng thử lại.' });
    }
});

// 5. Đăng xuất
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Lỗi xóa session:', err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;