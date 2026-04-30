const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff } = require('../middleware/auth');

router.get('/', requireStaff, (req, res) => {
    res.render('checkin/index');
});

router.post('/process', requireStaff, (req, res) => {
    const searchVal = req.body.search_val || req.body.member_id;

    db.query("SELECT * FROM members WHERE phone = ? OR id = ?", [searchVal, searchVal], (err, members) => {
        if (err || members.length === 0) {
            return res.json({ status: 'Not Found', message: 'Không tìm thấy hội viên trong hệ thống!' });
        }

        const member = members[0];

        // Nếu hội viên đang trong phòng (chưa check-out) → báo trạng thái Already.
        const sqlOpenSession = `
            SELECT id, checkin_time
            FROM checkin_history
            WHERE member_id = ? AND status = 'Success' AND checkout_time IS NULL
            ORDER BY checkin_time DESC LIMIT 1
        `;
        db.query(sqlOpenSession, [member.id], (err, openRows) => {
            if (err) return res.json({ status: 'Error', message: 'Lỗi truy vấn' });

            if (openRows.length > 0) {
                return res.json({
                    status: 'Already',
                    member: member,
                    session_id: openRows[0].id,
                    checkin_time: openRows[0].checkin_time,
                    message: 'Hội viên đang trong phòng. Bấm Check-out để kết thúc phiên.'
                });
            }

            const sqlCheckPackage = `
                SELECT expiration_date, package_id
                FROM registrations
                WHERE member_id = ? AND status = 'active' AND expiration_date >= CURRENT_DATE()
                ORDER BY expiration_date DESC LIMIT 1
            `;

            db.query(sqlCheckPackage, [member.id], (err, regs) => {
                if (!regs || regs.length === 0) {
                    return res.json({
                        status: 'Expired',
                        member: member,
                        expiration_date: null,
                        message: 'Thẻ đã hết hạn hoặc chưa đăng ký gói.'
                    });
                }

                res.json({
                    status: 'Success',
                    member: member,
                    expiration_date: regs[0].expiration_date,
                    message: 'Hợp lệ. Vui lòng bấm Xác nhận!'
                });
            });
        });
    });
});

router.post('/confirm', requireStaff, (req, res) => {
    const { member_id } = req.body;

    // Phòng thủ: kiểm tra một lần nữa rằng không có phiên đang mở để tránh double check-in
    // khi UI bị bypass.
    db.query(
        "SELECT id FROM checkin_history WHERE member_id = ? AND status = 'Success' AND checkout_time IS NULL LIMIT 1",
        [member_id],
        (err, rows) => {
            if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi truy vấn' });
            if (rows.length > 0) {
                return res.status(409).json({
                    status: 'Already',
                    message: 'Hội viên đang trong phòng. Vui lòng check-out trước khi check-in lại.'
                });
            }

            db.query(
                "INSERT INTO checkin_history (member_id, status, note) VALUES (?, 'Success', 'Hợp lệ')",
                [member_id],
                (err) => {
                    if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi lưu lịch sử' });
                    res.json({ status: 'Success', message: 'Đã lưu lịch sử check-in thành công!' });
                }
            );
        }
    );
});

// Danh sách phiên đang mở (đã check-in, chưa check-out).
router.get('/active', requireStaff, (req, res) => {
    const sql = `
        SELECT ch.id, ch.checkin_time, m.id AS member_id, m.fullname, m.phone
        FROM checkin_history ch
        JOIN members m ON ch.member_id = m.id
        WHERE ch.status = 'Success' AND ch.checkout_time IS NULL
        ORDER BY ch.checkin_time DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi truy vấn' });
        res.json({ status: 'Success', sessions: rows });
    });
});

// Đóng 1 phiên: chỉ cập nhật khi phiên còn mở (idempotent + chống double click).
router.post('/checkout/:id', requireStaff, (req, res) => {
    const id = req.params.id;
    db.query(
        "UPDATE checkin_history SET checkout_time = NOW() WHERE id = ? AND checkout_time IS NULL",
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi cập nhật' });
            if (result.affectedRows === 0) {
                return res.status(404).json({ status: 'NotFound', message: 'Phiên không tồn tại hoặc đã check-out.' });
            }
            res.json({ status: 'Success', message: 'Đã check-out thành công!' });
        }
    );
});

module.exports = router;
