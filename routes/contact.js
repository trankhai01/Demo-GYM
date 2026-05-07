const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../config/db');
const { requireStaff } = require('../middleware/auth');

const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { ok: false, error: 'Bạn đã gửi quá nhiều, vui lòng thử lại sau 1 giờ.' },
    standardHeaders: true,
    legacyHeaders: false
});

function sanitize(s, max = 1000) {
    if (typeof s !== 'string') return '';
    return s.trim().slice(0, max);
}

router.post('/contact', submitLimiter, (req, res) => {
    const fullname = sanitize(req.body.fullname, 150);
    const email = sanitize(req.body.email, 255);
    const phone = sanitize(req.body.phone, 30);
    const subject = sanitize(req.body.subject, 255);
    const message = sanitize(req.body.message, 4000);

    if (!fullname || !email || !message) {
        return res.status(400).render('contact-result', {
            ok: false,
            message: 'Vui lòng điền đầy đủ Họ tên, Email và Nội dung.'
        });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
        return res.status(400).render('contact-result', {
            ok: false,
            message: 'Email không hợp lệ.'
        });
    }

    db.query(
        `INSERT INTO contact_messages (fullname, email, phone, subject, message)
         VALUES (?, ?, ?, ?, ?)`,
        [fullname, email, phone || null, subject || null, message],
        (err) => {
            if (err) {
                console.error('[contact] INSERT:', err.message);
                return res.status(500).render('contact-result', {
                    ok: false,
                    message: 'Lỗi hệ thống, vui lòng thử lại sau.'
                });
            }
            res.render('contact-result', {
                ok: true,
                message: 'Cảm ơn bạn đã liên hệ! GymBro sẽ phản hồi trong vòng 24 giờ.'
            });
        }
    );
});

router.get('/admin/messages', requireStaff, (req, res) => {
    const filter = req.query.filter === 'unread' ? 'unread' : 'all';
    const where = filter === 'unread' ? 'WHERE is_read = 0' : '';

    db.query(
        `SELECT id, fullname, email, phone, subject, message, is_read, created_at
         FROM contact_messages ${where}
         ORDER BY created_at DESC LIMIT 200`,
        (err, rows) => {
            if (err) {
                console.error('[admin/messages] SELECT:', err.message);
                return res.status(500).render('error', { message: 'Lỗi tải tin nhắn liên hệ.' });
            }
            db.query(
                "SELECT COUNT(*) AS c FROM contact_messages WHERE is_read = 0",
                (err2, cntRows) => {
                    const unreadCount = (!err2 && cntRows && cntRows[0]) ? cntRows[0].c : 0;
                    res.render('admin/messages', {
                        messages: rows || [],
                        filter,
                        unreadCount
                    });
                }
            );
        }
    );
});

router.post('/admin/messages/:id/read', requireStaff, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).redirect('/admin/messages');
    }
    db.query(
        "UPDATE contact_messages SET is_read = 1 WHERE id = ?",
        [id],
        (err) => {
            if (err) console.error('[admin/messages] mark read:', err.message);
            res.redirect('/admin/messages' + (req.body.filter === 'unread' ? '?filter=unread' : ''));
        }
    );
});

router.post('/admin/messages/:id/delete', requireStaff, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).redirect('/admin/messages');
    }
    db.query(
        "DELETE FROM contact_messages WHERE id = ?",
        [id],
        (err) => {
            if (err) console.error('[admin/messages] delete:', err.message);
            res.redirect('/admin/messages' + (req.body.filter === 'unread' ? '?filter=unread' : ''));
        }
    );
});

module.exports = router;
