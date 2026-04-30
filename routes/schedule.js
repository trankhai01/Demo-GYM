const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireLogin, requireStaff } = require('../middleware/auth');

function isValidIsoDateTime(s) {
    if (typeof s !== 'string') return false;
    const t = Date.parse(s);
    return !isNaN(t);
}

function toMysqlDateTime(iso) {
    return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

// Trang lịch tập của hội viên (member): xem & đặt buổi của chính mình.
router.get('/', requireLogin, (req, res) => {
    const role = req.session.user.role;
    db.query("SELECT id, fullname FROM trainers ORDER BY fullname", (err, trainers) => {
        res.render('schedule/index', {
            trainers: err ? [] : trainers,
            isStaff: role === 'staff' || role === 'admin'
        });
    });
});

// Trang admin/staff: xem lịch của tất cả hội viên.
router.get('/admin', requireStaff, (req, res) => {
    db.query("SELECT id, fullname FROM trainers ORDER BY fullname", (err, trainers) => {
        res.render('schedule/admin', { trainers: err ? [] : trainers });
    });
});

// Member chỉ thấy booking của chính mình; staff/admin thấy tất cả.
router.get('/events', requireLogin, (req, res) => {
    const role = req.session.user.role;
    const userId = req.session.user.id;
    const { start, end } = req.query;

    if (!isValidIsoDateTime(start) || !isValidIsoDateTime(end)) {
        return res.status(400).json({ error: 'Tham số start/end không hợp lệ' });
    }

    const isStaff = role === 'staff' || role === 'admin';
    const baseSql = `
        SELECT b.id, b.member_id, b.trainer_id, b.start_time, b.end_time,
               b.title, b.note, b.status,
               m.fullname AS member_name, t.fullname AS trainer_name
        FROM bookings b
        JOIN members m ON b.member_id = m.id
        LEFT JOIN trainers t ON b.trainer_id = t.id
        WHERE b.start_time < ? AND b.end_time > ?
          AND b.status IN ('booked', 'completed')
    `;
    const sql = isStaff
        ? baseSql + " ORDER BY b.start_time"
        : baseSql + " AND b.member_id = ? ORDER BY b.start_time";
    const params = isStaff
        ? [toMysqlDateTime(end), toMysqlDateTime(start)]
        : [toMysqlDateTime(end), toMysqlDateTime(start), userId];

    db.query(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi truy vấn' });

        const events = rows.map(r => ({
            id: r.id,
            title: isStaff
                ? `${r.member_name}${r.trainer_name ? ' • ' + r.trainer_name : ''}`
                : (r.trainer_name ? `${r.title} • ${r.trainer_name}` : r.title),
            start: r.start_time,
            end: r.end_time,
            extendedProps: {
                member_id: r.member_id,
                member_name: r.member_name,
                trainer_id: r.trainer_id,
                trainer_name: r.trainer_name,
                note: r.note,
                status: r.status,
                title_raw: r.title
            },
            classNames: ['booking-' + r.status],
            color: r.status === 'completed' ? '#198754' : (r.trainer_id ? '#dc3545' : '#0d6efd')
        }));
        res.json(events);
    });
});

// Đặt 1 buổi mới. Chỉ member tự đặt cho chính mình; staff đặt giùm member nếu cần.
router.post('/book', requireLogin, (req, res) => {
    const role = req.session.user.role;
    const userId = req.session.user.id;
    const isStaff = role === 'staff' || role === 'admin';

    const { start_time, end_time, title, trainer_id, note, member_id } = req.body;

    if (!isValidIsoDateTime(start_time) || !isValidIsoDateTime(end_time)) {
        return res.status(400).json({ status: 'Error', message: 'Thời gian không hợp lệ.' });
    }
    const start = new Date(start_time);
    const end = new Date(end_time);
    if (end <= start) {
        return res.status(400).json({ status: 'Error', message: 'Giờ kết thúc phải sau giờ bắt đầu.' });
    }
    if (start < new Date(Date.now() - 5 * 60 * 1000)) {
        return res.status(400).json({ status: 'Error', message: 'Không thể đặt lịch trong quá khứ.' });
    }
    const durationMin = (end - start) / 60000;
    if (durationMin < 15 || durationMin > 240) {
        return res.status(400).json({ status: 'Error', message: 'Buổi tập phải từ 15 phút đến 4 giờ.' });
    }

    const targetMemberId = isStaff && member_id ? Number(member_id) : userId;
    const trainerId = trainer_id ? Number(trainer_id) : null;
    const finalTitle = (title && String(title).trim()) || 'Buổi tập';
    const finalNote = note ? String(note).slice(0, 255) : null;

    const startSql = toMysqlDateTime(start_time);
    const endSql = toMysqlDateTime(end_time);

    // 1. Kiểm tra chồng giờ với booking đang active của chính member.
    const sqlOverlapMember = `
        SELECT id FROM bookings
        WHERE member_id = ? AND status = 'booked'
          AND start_time < ? AND end_time > ?
        LIMIT 1
    `;
    db.query(sqlOverlapMember, [targetMemberId, endSql, startSql], (err, rows) => {
        if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi truy vấn' });
        if (rows.length > 0) {
            return res.status(409).json({
                status: 'Conflict',
                message: 'Hội viên đã có buổi tập trùng khoảng thời gian này.'
            });
        }

        // 2. Nếu có HLV, kiểm tra HLV có trùng giờ không.
        const checkTrainerOverlap = (cb) => {
            if (!trainerId) return cb(null);
            db.query(
                `SELECT id FROM bookings
                 WHERE trainer_id = ? AND status = 'booked'
                   AND start_time < ? AND end_time > ? LIMIT 1`,
                [trainerId, endSql, startSql],
                (err2, trainerRows) => {
                    if (err2) return cb({ http: 500, message: 'Lỗi truy vấn HLV' });
                    if (trainerRows.length > 0) {
                        return cb({
                            http: 409,
                            message: 'Huấn luyện viên đã có buổi khác trong khoảng thời gian này.'
                        });
                    }
                    cb(null);
                }
            );
        };

        checkTrainerOverlap((conflictErr) => {
            if (conflictErr) {
                return res.status(conflictErr.http).json({
                    status: 'Conflict',
                    message: conflictErr.message
                });
            }

            db.query(
                `INSERT INTO bookings (member_id, trainer_id, start_time, end_time, title, note, status)
                 VALUES (?, ?, ?, ?, ?, ?, 'booked')`,
                [targetMemberId, trainerId, startSql, endSql, finalTitle, finalNote],
                (err3, result) => {
                    if (err3) return res.status(500).json({ status: 'Error', message: 'Lỗi lưu lịch' });
                    res.status(201).json({
                        status: 'Success',
                        booking_id: result.insertId,
                        message: 'Đã đặt lịch thành công!'
                    });
                }
            );
        });
    });
});

//Member chỉ hủy được booking của chính mình; staff hủy bất kỳ.
router.post('/cancel/:id', requireLogin, (req, res) => {
    const role = req.session.user.role;
    const userId = req.session.user.id;
    const isStaff = role === 'staff' || role === 'admin';
    const id = Number(req.params.id);

    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ status: 'Error', message: 'ID không hợp lệ' });
    }
    const sql = isStaff
        ? "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'booked'"
        : "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'booked' AND member_id = ?";
    const params = isStaff ? [id] : [id, userId];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi cập nhật' });
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'NotFound',
                message: 'Không tìm thấy buổi hoặc buổi đã bị hủy/hoàn thành (hoặc bạn không có quyền).'
            });
        }
        res.json({ status: 'Success', message: 'Đã hủy buổi tập!' });
    });
});

module.exports = router;
