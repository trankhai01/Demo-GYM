const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
});

const forgotLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ.'
});

router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login');
});

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
            const dest = user.role === 'member' ? '/dashboard' : '/';
            res.redirect(dest);
        });
    });
});

router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register');
});

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

router.get('/forgot-password', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('forgot-password', { message: null, error: null, phone: '' });
});

router.post('/forgot-password', forgotLimiter, (req, res) => {
    const phone = (req.body.phone || '').trim();
    const note = (req.body.note || '').trim().slice(0, 255);

    if (!phone) {
        return res.render('forgot-password', {
            message: null,
            error: 'Vui lòng nhập số điện thoại đã đăng ký.',
            phone
        });
    }

    const SUCCESS_MSG = 'Nếu số điện thoại này có tài khoản trong hệ thống, ' +
        'yêu cầu đổi mật khẩu đã được gửi cho quản trị viên. ' +
        'Vui lòng đến quầy lễ tân để nhận mật khẩu tạm thời.';

    db.query("SELECT id FROM members WHERE phone = ? LIMIT 1", [phone], (err, rows) => {
        if (err) {
            console.error('[forgot-password] Lỗi query members:', err.message);
            return res.render('forgot-password', {
                message: null,
                error: 'Lỗi hệ thống, vui lòng thử lại sau.',
                phone
            });
        }
        if (rows.length === 0) {
            return res.render('forgot-password', { message: SUCCESS_MSG, error: null, phone: '' });
        }

        const memberId = rows[0].id;
        db.query(
            "SELECT id FROM password_reset_requests WHERE member_id = ? AND status = 'pending' LIMIT 1",
            [memberId],
            (err2, existing) => {
                if (err2) {
                    console.error('[forgot-password] Lỗi check pending:', err2.message);
                    return res.render('forgot-password', {
                        message: null,
                        error: 'Lỗi hệ thống, vui lòng thử lại sau.',
                        phone
                    });
                }
                if (existing.length > 0) {
                    return res.render('forgot-password', { message: SUCCESS_MSG, error: null, phone: '' });
                }
                db.query(
                    "INSERT INTO password_reset_requests (member_id, note) VALUES (?, ?)",
                    [memberId, note || null],
                    (err3) => {
                        if (err3) {
                            console.error('[forgot-password] Lỗi insert:', err3.message);
                            return res.render('forgot-password', {
                                message: null,
                                error: 'Lỗi hệ thống, vui lòng thử lại sau.',
                                phone
                            });
                        }
                        res.render('forgot-password', { message: SUCCESS_MSG, error: null, phone: '' });
                    }
                );
            }
        );
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Lỗi xóa session:', err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;