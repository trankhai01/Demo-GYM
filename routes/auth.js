const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const mailer = require('../lib/mailer');

const TEMP_PW_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
function generateTempPassword(length = 8) {
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) out += TEMP_PW_ALPHABET[bytes[i] % TEMP_PW_ALPHABET.length];
    return out;
}

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
    const { fullname, phone, password, gender, email } = req.body;

    if (!fullname || !phone || !password) {
        return res.render('register', {
            error: 'Vui lòng điền đầy đủ thông tin!',
            fullname, phone, gender, email
        });
    }

    const cleanEmail = email && email.trim() ? email.trim() : null;
    const join_date = new Date().toISOString().split('T')[0];

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO members (fullname, phone, email, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, ?, 'member')";

        db.query(sql, [fullname, phone, cleanEmail, gender || 'Nam', join_date, hashedPassword], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.render('register', {
                        error: 'Số điện thoại này đã được đăng ký!',
                        fullname, phone, gender, email
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
    res.render('forgot-password', { message: null, error: null, phone: '', email: '' });
});

// Khi member quên MK: verify (phone, email) khớp với DB → sinh MK tạm + gửi mail tự động.
// Trả message chung chung khi sai để tránh phishing dò email/SĐT.
router.post('/forgot-password', forgotLimiter, async (req, res) => {
    const phone = (req.body.phone || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();

    if (!phone || !email) {
        return res.render('forgot-password', {
            message: null,
            error: 'Vui lòng nhập số điện thoại và email đã đăng ký.',
            phone, email
        });
    }

    const SUCCESS_MSG = 'Nếu thông tin trùng khớp, mật khẩu mới đã được gửi tới email của bạn. ' +
        'Kiểm tra hộp thư (kể cả Spam) trong vài phút tới.';

    db.query(
        "SELECT id, fullname, email FROM members WHERE phone = ? LIMIT 1",
        [phone],
        async (err, rows) => {
            if (err) {
                console.error('[forgot-password] query members:', err.message);
                return res.render('forgot-password', {
                    message: null, error: 'Lỗi hệ thống, vui lòng thử lại sau.', phone, email
                });
            }

            const member = rows[0];
            const emailMatches = member && member.email && member.email.toLowerCase() === email;
            if (!member || !emailMatches) {
                return res.render('forgot-password', { message: SUCCESS_MSG, error: null, phone: '', email: '' });
            }

            if (!mailer.isEnabled()) {
                return res.render('forgot-password', {
                    message: null,
                    error: 'Hệ thống chưa cấu hình email server. Vui lòng liên hệ quầy lễ tân để được hỗ trợ.',
                    phone, email
                });
            }

            const tempPassword = generateTempPassword(8);
            let hashed;
            try {
                hashed = await bcrypt.hash(tempPassword, 10);
            } catch (e) {
                console.error('[forgot-password] bcrypt:', e.message);
                return res.render('forgot-password', {
                    message: null, error: 'Lỗi tạo mật khẩu mới.', phone, email
                });
            }

            db.query("UPDATE members SET password = ? WHERE id = ?", [hashed, member.id], (errUpd) => {
                if (errUpd) {
                    console.error('[forgot-password] UPDATE members:', errUpd.message);
                    return res.render('forgot-password', {
                        message: null, error: 'Lỗi cập nhật mật khẩu.', phone, email
                    });
                }

                db.query(
                    "INSERT INTO password_reset_requests (member_id, note, status, resolved_at) VALUES (?, 'auto-reset (forgot-password)', 'resolved', NOW())",
                    [member.id],
                    (errLog) => {
                        if (errLog) console.error('[forgot-password] log insert:', errLog.message);
                    }
                );

                const tpl = mailer.passwordResetTemplate({
                    fullname: member.fullname,
                    tempPassword,
                    loginUrl: `${req.protocol}://${req.get('host')}/login`
                });
                mailer.sendMail({ to: member.email, subject: tpl.subject, html: tpl.html, text: tpl.text })
                    .catch((e) => console.error('[forgot-password] sendMail:', e.message));

                res.render('forgot-password', { message: SUCCESS_MSG, error: null, phone: '', email: '' });
            });
        }
    );
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Lỗi xóa session:', err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;