const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// Trang lịch sử reset MK (audit). Forgot-password tự động xử lý → không còn pending.
router.get('/', (req, res) => {
    const sqlHistory = `
        SELECT prr.id, prr.status, prr.requested_at, prr.resolved_at, prr.note,
               m.fullname, m.phone, m.email,
               r.fullname AS resolver_name
        FROM password_reset_requests prr
        JOIN members m ON prr.member_id = m.id
        LEFT JOIN members r ON prr.resolved_by = r.id
        ORDER BY COALESCE(prr.resolved_at, prr.requested_at) DESC
        LIMIT 50
    `;
    db.query(sqlHistory, (err, history) => {
        if (err) {
            console.error('[admin/password-resets] history:', err.message);
            return res.status(500).render('error', { message: 'Lỗi tải lịch sử reset MK.' });
        }
        res.render('admin/password-resets', { history });
    });
});

module.exports = router;
