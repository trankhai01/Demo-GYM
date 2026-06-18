const express = require('express');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const mailer = require('../lib/mailer');

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
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');

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

        req.session.regenerate((err) => {
            if (err) {
                console.error('Lỗi tạo lại session:', err);
                return res.status(500).render('error', { message: 'Lỗi đăng nhập, vui lòng thử lại.' });
            }

            req.session.user = {
                id: user.id,
                username: user.fullname,
                role: user.role
            };

            req.session.save((saveErr) => {
                if (saveErr) console.error('Lỗi lưu session:', saveErr);
                const dest = user.role === 'member' ? '/dashboard' : '/';
                res.redirect(dest);
            });
        });
    });
});

router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register');
});

router.post('/register', async (req, res) => {
    const fullname = String(req.body.fullname || '').trim();
    const phone = String(req.body.phone || '').trim();
    const password = String(req.body.password || '');
    const gender = req.body.gender;
    const email = String(req.body.email || '').trim().toLowerCase();

    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullname) errors.fullname = 'Vui lòng nhập họ và tên.';
    if (!phone) errors.phone = 'Vui lòng nhập số điện thoại.';
    if (!email) {
        errors.email = 'Vui lòng nhập email.';
    } else if (!emailRegex.test(email)) {
        errors.email = 'Email không hợp lệ.';
    }
    if (!password) {
        errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
        errors.password = 'Mật khẩu cần tối thiểu 6 ký tự.';
    }

    if (Object.keys(errors).length > 0) {
        return res.render('register', {
            errors,
            fullname, phone, gender, email
        });
    }

    db.query("SELECT phone FROM members WHERE phone = ?", [phone], async (dbErr, rows) => {
        if (dbErr) {
            console.error(dbErr);
            return res.status(500).render('error', { message: 'Lỗi hệ thống, vui lòng thử lại.' });
        }

        if (rows.length > 0) {
            errors.phone = 'Số điện thoại này đã được đăng ký!';
        }

        if (Object.keys(errors).length > 0) {
            return res.render('register', {
                errors,
                fullname, phone, gender, email
            });
        }

        if (!mailer.isEnabled()) {
            return res.render('register', {
                error: 'Hệ thống gửi email hiện tại không hoạt động. Vui lòng quay lại sau.',
                fullname, phone, gender, email
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const otpCode = crypto.randomInt(100000, 999999).toString();
            const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút

            req.session.tempRegister = {
                fullname,
                phone,
                email,
                password: hashedPassword,
                gender: gender || 'Nam',
                otpCode,
                expiresAt
            };

            const tpl = mailer.registerOtpTemplate({ fullname, otpCode });
            await mailer.sendMail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });

            res.redirect('/register/verify-otp');
        } catch (err) {
            console.error('[register otp]', err.message);
            return res.status(500).render('error', { message: 'Lỗi hệ thống khi gửi mã xác thực.' });
        }
    });
});

router.get('/register/verify-otp', (req, res) => {
    if (req.session.user) return res.redirect('/');
    if (!req.session.tempRegister) return res.redirect('/register');
    res.render('register-verify-otp', { email: req.session.tempRegister.email, error: null });
});

router.post('/register/verify-otp', async (req, res) => {
    if (!req.session.tempRegister) {
        return res.status(400).render('error', { message: 'Phiên đăng ký đã hết hạn. Vui lòng thực hiện lại từ đầu.' });
    }

    const { fullname, phone, email, password, gender, otpCode, expiresAt } = req.session.tempRegister;
    const inputOtp = String(req.body.otp || '').trim();

    if (Date.now() > expiresAt) {
        delete req.session.tempRegister;
        return res.render('register-verify-otp', {
            email,
            error: 'Mã xác thực đã hết hạn. Vui lòng đăng ký lại.'
        });
    }

    if (inputOtp !== otpCode) {
        return res.render('register-verify-otp', {
            email,
            error: 'Mã xác thực không đúng. Vui lòng thử lại.'
        });
    }

    const join_date = new Date().toISOString().split('T')[0];
    const sql = "INSERT INTO members (fullname, phone, email, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, ?, 'member')";

    db.query(sql, [fullname, phone, email, gender, join_date, password], (err) => {
        if (err) {
            console.error('[verify-otp db error]', err);
            return res.status(500).render('error', { message: 'Lỗi hệ thống khi lưu thông tin hội viên.' });
        }
        delete req.session.tempRegister;
        res.redirect('/login?notice=Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
    });
});

router.get('/forgot-password', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('forgot-password');
});

router.post('/forgot-password', forgotLimiter, async (req, res) => {
    const phone = (req.body.phone || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();

    if (!phone || !email) {
        return res.json({ ok: false, error: 'Vui lòng nhập số điện thoại và email đã đăng ký.' });
    }
    const SUCCESS_MSG = 'Nếu thông tin trùng khớp, mã OTP đã được gửi tới email của bạn. Kiểm tra hộp thư (kể cả Spam).';

    db.query(
        "SELECT id, fullname, email FROM members WHERE phone = ? LIMIT 1",
        [phone],
        async (err, rows) => {
            if (err) {
                console.error('[forgot-password] query members:', err.message);
                return res.json({ ok: false, error: 'Lỗi hệ thống, vui lòng thử lại sau.' });
            }

            const member = rows[0];
            const emailMatches = member && member.email && member.email.toLowerCase() === email;
            if (!member || !emailMatches) {
                return res.json({ ok: true, message: SUCCESS_MSG });
            }

            if (!mailer.isEnabled()) {
                return res.json({ ok: false, error: 'Hệ thống chưa cấu hình email server. Vui lòng liên hệ quầy lễ tân.' });
            }
            const otpCode = crypto.randomInt(100000, 999999).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

            db.query("DELETE FROM password_otp WHERE member_id = ?", [member.id], (delErr) => {
                if (delErr) console.error('[forgot-password] delete old OTP:', delErr.message);

                db.query(
                    "INSERT INTO password_otp (member_id, otp_code, expires_at) VALUES (?, ?, ?)",
                    [member.id, otpCode, expiresAt],
                    (insErr) => {
                        if (insErr) {
                            console.error('[forgot-password] insert OTP:', insErr.message);
                            return res.json({ ok: false, error: 'Lỗi tạo mã OTP.' });
                        }
                        req.session.resetMemberId = member.id;
                        const tpl = mailer.otpTemplate({ fullname: member.fullname, otpCode });
                        mailer.sendMail({ to: member.email, subject: tpl.subject, html: tpl.html, text: tpl.text })
                            .catch((e) => console.error('[forgot-password] sendMail:', e.message));

                        res.json({ ok: true, message: SUCCESS_MSG });
                    }
                );
            });
        }
    );
});

router.post('/forgot-password/verify-otp', (req, res) => {
    const otp = (req.body.otp || '').trim();
    const memberId = req.session.resetMemberId;

    if (!memberId) {
        return res.json({ ok: false, error: 'Phiên làm việc đã hết hạn. Vui lòng thử lại từ đầu.' });
    }
    if (!otp || otp.length !== 6) {
        return res.json({ ok: false, error: 'Vui lòng nhập mã OTP 6 chữ số.' });
    }

    db.query(
        "SELECT * FROM password_otp WHERE member_id = ? AND otp_code = ? AND verified = 0 ORDER BY id DESC LIMIT 1",
        [memberId, otp],
        (err, rows) => {
            if (err) {
                console.error('[verify-otp] query:', err.message);
                return res.json({ ok: false, error: 'Lỗi hệ thống.' });
            }
            if (!rows || rows.length === 0) {
                return res.json({ ok: false, error: 'Mã OTP không đúng.' });
            }

            const record = rows[0];
            if (new Date(record.expires_at) < new Date()) {
                return res.json({ ok: false, error: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
            }

            db.query("UPDATE password_otp SET verified = 1 WHERE id = ?", [record.id], (updErr) => {
                if (updErr) console.error('[verify-otp] update:', updErr.message);
            });
            req.session.otpVerified = true;
            res.json({ ok: true, message: 'Xác thực thành công!' });
        }
    );
});

router.post('/forgot-password/reset', async (req, res) => {
    const memberId = req.session.resetMemberId;
    const otpVerified = req.session.otpVerified;
    const password = (req.body.password || '').trim();
    const confirmPassword = (req.body.confirmPassword || '').trim();

    if (!memberId || !otpVerified) {
        return res.json({ ok: false, error: 'Phiên làm việc không hợp lệ. Vui lòng thử lại từ đầu.' });
    }
    if (!password || password.length < 6) {
        return res.json({ ok: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }
    if (password !== confirmPassword) {
        return res.json({ ok: false, error: 'Mật khẩu xác nhận không khớp.' });
    }

    try {
        const hashed = await bcrypt.hash(password, 10);
        db.query("UPDATE members SET password = ? WHERE id = ?", [hashed, memberId], (err) => {
            if (err) {
                console.error('[reset-password] update:', err.message);
                return res.json({ ok: false, error: 'Lỗi cập nhật mật khẩu.' });
            }

            db.query(
                "INSERT INTO password_reset_requests (member_id, note, status, resolved_at) VALUES (?, 'auto-reset (OTP)', 'resolved', NOW())",
                [memberId],
                (logErr) => { if (logErr) console.error('[reset-password] log:', logErr.message); }
            );
            db.query("DELETE FROM password_otp WHERE member_id = ?", [memberId]);
            delete req.session.resetMemberId;
            delete req.session.otpVerified;

            res.json({ ok: true, message: 'Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...' });
        });
    } catch (e) {
        console.error('[reset-password] bcrypt:', e.message);
        res.json({ ok: false, error: 'Lỗi mã hóa mật khẩu.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error('Lỗi xóa session:', err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;
