const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

// Sinh mật khẩu tạm thời 8 ký tự gồm chữ + số (bỏ chữ dễ nhầm: 0/O, 1/l/I).
const TEMP_PW_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
function generateTempPassword(length = 8) {
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += TEMP_PW_ALPHABET[bytes[i] % TEMP_PW_ALPHABET.length];
    }
    return out;
}

// Toàn bộ endpoint chỉ admin mới truy cập được.
router.use(requireAdmin);

// Trang quản trị: liệt kê yêu cầu pending + lịch sử resolved/dismissed.
router.get('/', (req, res) => {
    const tempPassword = req.query.temp_password || null;
    const tempMember = req.query.temp_member || null;

    const sqlPending = `
        SELECT prr.id, prr.requested_at, prr.note,
               m.id AS member_id, m.fullname, m.phone
        FROM password_reset_requests prr
        JOIN members m ON prr.member_id = m.id
        WHERE prr.status = 'pending'
        ORDER BY prr.requested_at ASC
    `;
    const sqlHistory = `
        SELECT prr.id, prr.status, prr.requested_at, prr.resolved_at, prr.note,
               m.fullname, m.phone,
               r.fullname AS resolver_name
        FROM password_reset_requests prr
        JOIN members m ON prr.member_id = m.id
        LEFT JOIN members r ON prr.resolved_by = r.id
        WHERE prr.status IN ('resolved', 'dismissed')
        ORDER BY prr.resolved_at DESC LIMIT 30
    `;

    db.query(sqlPending, (err, pending) => {
        if (err) {
            console.error('[admin/password-resets] pending:', err.message);
            return res.status(500).render('error', { message: 'Lỗi tải yêu cầu reset.' });
        }
        db.query(sqlHistory, (err2, history) => {
            if (err2) {
                console.error('[admin/password-resets] history:', err2.message);
                return res.status(500).render('error', { message: 'Lỗi tải lịch sử.' });
            }
            res.render('admin/password-resets', {
                pending,
                history,
                tempPassword,
                tempMember
            });
        });
    });
});

// Reset mật khẩu cho 1 yêu cầu pending. Sinh mật khẩu mới ngẫu nhiên,
// hash bằng bcrypt, cập nhật bảng members + đánh dấu request resolved.
// Bọc trong transaction để 2 thao tác (update password + update request)
// luôn nhất quán: nếu một bên fail thì cả hai rollback.
router.post('/:id/reset', async (req, res) => {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
        return res.status(400).render('error', { message: 'ID không hợp lệ.' });
    }
    const adminId = req.session.user.id;
    const tempPassword = generateTempPassword(8);
    let hashed;
    try {
        hashed = await bcrypt.hash(tempPassword, 10);
    } catch (e) {
        console.error('[admin/password-resets] bcrypt:', e.message);
        return res.status(500).render('error', { message: 'Lỗi tạo mật khẩu mới.' });
    }

    db.getConnection((err, conn) => {
        if (err) {
            console.error('[admin/password-resets] getConnection:', err.message);
            return res.status(500).render('error', { message: 'Lỗi kết nối DB.' });
        }
        const fail = (msg, sqlErr) => {
            if (sqlErr) console.error('[admin/password-resets]', msg, ':', sqlErr.message);
            conn.rollback(() => {
                conn.release();
                res.status(500).render('error', { message: 'Lỗi cập nhật mật khẩu.' });
            });
        };

        conn.beginTransaction((errTx) => {
            if (errTx) {
                conn.release();
                return res.status(500).render('error', { message: 'Lỗi mở transaction.' });
            }

            // Khóa row của yêu cầu pending để tránh 2 admin reset cùng lúc.
            conn.query(
                `SELECT id, member_id FROM password_reset_requests
                 WHERE id = ? AND status = 'pending' FOR UPDATE`,
                [requestId],
                (err1, rows) => {
                    if (err1) return fail('SELECT request', err1);
                    if (rows.length === 0) {
                        return conn.rollback(() => {
                            conn.release();
                            res.redirect('/admin/password-resets?msg=already_resolved');
                        });
                    }
                    const memberId = rows[0].member_id;

                    conn.query(
                        "UPDATE members SET password = ? WHERE id = ?",
                        [hashed, memberId],
                        (err2) => {
                            if (err2) return fail('UPDATE members', err2);

                            conn.query(
                                `UPDATE password_reset_requests
                                 SET status = 'resolved', resolved_at = NOW(), resolved_by = ?
                                 WHERE id = ?`,
                                [adminId, requestId],
                                (err3) => {
                                    if (err3) return fail('UPDATE request', err3);
                                    conn.commit((errCommit) => {
                                        if (errCommit) return fail('COMMIT', errCommit);
                                        conn.release();
                                        // Truyền mật khẩu tạm qua query string một lần
                                        // (chỉ admin xem được vì requireAdmin).
                                        const url = `/admin/password-resets` +
                                            `?temp_password=${encodeURIComponent(tempPassword)}` +
                                            `&temp_member=${memberId}`;
                                        res.redirect(url);
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    });
});

// Bỏ qua 1 yêu cầu (vd: yêu cầu spam, không phải member thật).
router.post('/:id/dismiss', (req, res) => {
    const requestId = Number(req.params.id);
    if (!Number.isFinite(requestId) || requestId <= 0) {
        return res.status(400).render('error', { message: 'ID không hợp lệ.' });
    }
    const adminId = req.session.user.id;
    db.query(
        `UPDATE password_reset_requests
         SET status = 'dismissed', resolved_at = NOW(), resolved_by = ?
         WHERE id = ? AND status = 'pending'`,
        [adminId, requestId],
        (err) => {
            if (err) {
                console.error('[admin/password-resets] dismiss:', err.message);
                return res.status(500).render('error', { message: 'Lỗi cập nhật.' });
            }
            res.redirect('/admin/password-resets');
        }
    );
});

module.exports = router;
