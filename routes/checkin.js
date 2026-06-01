const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff } = require('../middleware/auth');
const { STATUS } = require('../lib/status');

router.get('/', requireStaff, (req, res) => {
    res.render('checkin/index');
});

router.post('/process', requireStaff, (req, res) => {
    const searchVal = (req.body.search_val || req.body.member_id || '').toString().trim();
    const searchId = parseInt(searchVal) || 0;

    if (!searchVal) {
        return res.json({ status: 'Error', message: 'Vui lòng nhập thông tin!' });
    }

    db.query("SELECT * FROM members WHERE phone = ? OR id = ?", [searchVal, searchId], (err, members) => {
        if (err) {
            console.error('Lỗi query members:', err.message);
            return res.json({ status: 'Error', message: 'Lỗi truy vấn: ' + err.message });
        }
        if (members.length === 0) {
            return res.json({ status: 'Not Found', message: 'Không tìm thấy hội viên trong hệ thống!' });
        }

        const member = members[0];

        const sqlOpenSession = `
            SELECT id, checkin_time FROM checkin_history
            WHERE member_id = ? AND status = ? AND checkout_time IS NULL
            ORDER BY checkin_time DESC LIMIT 1
        `;
        // Chỉ check-in gói đã thanh toán.
        const sqlCheckPackage = `
            SELECT expiration_date, package_id FROM registrations
            WHERE member_id = ? AND status = ? AND payment_status = ?
              AND expiration_date >= CURRENT_DATE()
            ORDER BY expiration_date DESC LIMIT 1
        `;

        db.query(sqlOpenSession, [member.id, STATUS.CHECKIN.SUCCESS], (err, openRows) => {
            if (err) {
                console.error('Lỗi sqlOpenSession:', err.message);
                return res.json({ status: 'Error', message: 'Lỗi truy vấn: ' + err.message });
            }

            db.query(sqlCheckPackage, [member.id, STATUS.REGISTRATION.ACTIVE, STATUS.PAYMENT.SUCCESS], (err2, regs) => {
                if (err2) {
                    console.error('Lỗi sqlCheckPackage:', err2.message);
                    return res.json({ status: 'Error', message: 'Lỗi truy vấn: ' + err2.message });
                }

                const expiration = regs && regs.length > 0 ? regs[0].expiration_date : null;

                if (openRows.length > 0) {
                    return res.json({
                        status: 'Already',
                        member: member,
                        session_id: openRows[0].id,
                        checkin_time: openRows[0].checkin_time,
                        expiration_date: expiration,
                        message: 'Hội viên đang trong phòng. Bấm Check-out để kết thúc phiên.'
                    });
                }

                if (!expiration) {
                    return res.json({
                        status: 'Expired',
                        member: member,
                        expiration_date: null,
                        message: 'Thẻ đã hết hạn hoặc chưa đăng ký gói.'
                    });
                }

                res.json({
                    status: STATUS.API.SUCCESS,
                    member: member,
                    expiration_date: expiration,
                    message: 'Hợp lệ. Vui lòng bấm Xác nhận!'
                });
            });
        });
    });
});

router.post('/confirm', requireStaff, (req, res) => {
    const { member_id } = req.body;
    const memberId = Number(member_id);
    if (!Number.isFinite(memberId) || memberId <= 0) {
        return res.status(400).json({ status: 'Error', message: 'Hội viên không hợp lệ.' });
    }

    db.query(
        "SELECT id FROM checkin_history WHERE member_id = ? AND status = ? AND checkout_time IS NULL LIMIT 1",
        [memberId, STATUS.CHECKIN.SUCCESS],
        (err, rows) => {
            if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi truy vấn' });
            if (rows.length > 0) {
                return res.status(409).json({
                    status: 'Already',
                    message: 'Hội viên đang trong phòng. Vui lòng check-out trước khi check-in lại.'
                });
            }

            db.query(
                `SELECT id FROM registrations
                 WHERE member_id = ? AND status = ? AND payment_status = ?
                   AND expiration_date >= CURRENT_DATE()
                 ORDER BY expiration_date DESC LIMIT 1`,
                [memberId, STATUS.REGISTRATION.ACTIVE, STATUS.PAYMENT.SUCCESS],
                (err2, regs) => {
                    if (err2) return res.status(500).json({ status: 'Error', message: 'Lỗi kiểm tra gói tập' });
                    if (!regs || regs.length === 0) {
                        return res.status(403).json({
                            status: 'Expired',
                            message: 'Thẻ đã hết hạn hoặc chưa đăng ký gói.'
                        });
                    }

                    db.query(
                        "INSERT INTO checkin_history (member_id, status, note) VALUES (?, ?, 'Hợp lệ')",
                        [memberId, STATUS.CHECKIN.SUCCESS],
                        (err3) => {
                            if (err3) return res.status(500).json({ status: 'Error', message: 'Lỗi lưu lịch sử' });
                            res.json({ status: STATUS.API.SUCCESS, message: 'Đã lưu lịch sử check-in thành công!' });
                        }
                    );
                }
            );
        }
    );
});

router.get('/active', requireStaff, (req, res) => {
    const sql = `
        SELECT ch.id, ch.checkin_time, m.id AS member_id, m.fullname, m.phone
        FROM checkin_history ch
        JOIN members m ON ch.member_id = m.id
        WHERE ch.status = ? AND ch.checkout_time IS NULL
        ORDER BY ch.checkin_time DESC
    `;
    db.query(sql, [STATUS.CHECKIN.SUCCESS], (err, rows) => {
        if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi truy vấn' });
        res.json({ status: STATUS.API.SUCCESS, sessions: rows });
    });
});

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
            res.json({ status: STATUS.API.SUCCESS, message: 'Đã check-out thành công!' });
        }
    );
});

module.exports = router;
