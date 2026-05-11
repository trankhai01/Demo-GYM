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
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

router.get('/', requireLogin, (req, res) => {
    const role = req.session.user.role;
    db.query("SELECT id, fullname FROM trainers ORDER BY fullname", (err, trainers) => {
        res.render('schedule/index', {
            trainers: err ? [] : trainers,
            isStaff: role === 'staff' || role === 'admin'
        });
    });
});

router.get('/admin', requireStaff, (req, res) => {
    db.query("SELECT id, fullname FROM trainers ORDER BY fullname", (err, trainers) => {
        res.render('schedule/admin', { trainers: err ? [] : trainers });
    });
});

/* ============================================================
 * GET /schedule/available-trainers?start=...&end=...
 * Trả về danh sách HLV chưa bị conflict trong khoảng thời gian.
 * Nếu trainer đã có booking khác overlap -> không trả về.
 * ============================================================ */
router.get('/available-trainers', requireLogin, (req, res) => {
    const { start, end } = req.query;
    if (!isValidIsoDateTime(start) || !isValidIsoDateTime(end)) {
        return res.status(400).json({ error: 'Tham số start/end không hợp lệ' });
    }
    const startSql = toMysqlDateTime(start);
    const endSql = toMysqlDateTime(end);

    /* HLV available = HLV không có booking nào overlap với khoảng [start, end) */
    const sql = `
        SELECT t.id, t.fullname, t.specialty
        FROM trainers t
        WHERE t.status = 'Active'
          AND NOT EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.trainer_id = t.id
                AND b.status = 'booked'
                AND b.start_time < ?
                AND b.end_time > ?
          )
        ORDER BY t.fullname
    `;
    db.query(sql, [endSql, startSql], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi truy vấn' });
        res.json(rows || []);
    });
});

/* ============================================================
 * GET /schedule/trainer/:id  (admin/staff)
 * Xem lịch của 1 HLV cụ thể.
 * ============================================================ */
router.get('/trainer/:id', requireStaff, (req, res) => {
    const trainerId = Number(req.params.id);
    if (!Number.isFinite(trainerId) || trainerId <= 0) {
        return res.status(400).render('error', { message: 'ID HLV không hợp lệ' });
    }
    db.query(
        "SELECT id, fullname, specialty, phone, image_url FROM trainers WHERE id = ?",
        [trainerId],
        (err, rows) => {
            if (err || rows.length === 0) {
                return res.status(404).render('error', { message: 'Không tìm thấy HLV.' });
            }
            res.render('schedule/trainer', { trainer: rows[0] });
        }
    );
});

/* ============================================================
 * GET /schedule/trainer-events/:id?start=...&end=...
 * JSON các booking của 1 HLV trong khoảng thời gian.
 * ============================================================ */
router.get('/trainer-events/:id', requireStaff, (req, res) => {
    const trainerId = Number(req.params.id);
    const { start, end } = req.query;
    if (!Number.isFinite(trainerId) || !isValidIsoDateTime(start) || !isValidIsoDateTime(end)) {
        return res.status(400).json({ error: 'Tham số không hợp lệ' });
    }
    const sql = `
        SELECT b.id, b.start_time, b.end_time, b.title, b.note, b.status,
               m.id AS member_id, m.fullname AS member_name
        FROM bookings b
        JOIN members m ON b.member_id = m.id
        WHERE b.trainer_id = ?
          AND b.start_time < ? AND b.end_time > ?
          AND b.status IN ('booked', 'completed')
        ORDER BY b.start_time
    `;
    db.query(sql, [trainerId, toMysqlDateTime(end), toMysqlDateTime(start)], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi truy vấn' });
        const events = rows.map(r => ({
            id: r.id,
            title: r.member_name + ' • ' + r.title,
            start: r.start_time,
            end: r.end_time,
            extendedProps: {
                member_id: r.member_id,
                member_name: r.member_name,
                note: r.note,
                status: r.status
            },
            color: r.status === 'completed' ? '#10b981' : '#4f46e5'
        }));
        res.json(events);
    });
});

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

    db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ status: 'Error', message: 'Không lấy được kết nối DB' });

        const fail = (httpCode, payload, sqlErr) => {
            if (sqlErr) console.error('[POST /schedule/book]', sqlErr.message);
            conn.rollback(() => {
                conn.release();
                res.status(httpCode).json(payload);
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).json({ status: 'Error', message: 'Lỗi mở transaction' });
            }

            const sqlOverlapMember = `
                SELECT id FROM bookings
                WHERE member_id = ? AND status = 'booked'
                  AND start_time < ? AND end_time > ?
                LIMIT 1
                FOR UPDATE
            `;
            conn.query(sqlOverlapMember, [targetMemberId, endSql, startSql], (err, rows) => {
                if (err) return fail(500, { status: 'Error', message: 'Lỗi truy vấn' }, err);
                if (rows.length > 0) {
                    return fail(409, {
                        status: 'Conflict',
                        message: 'Hội viên đã có buổi tập trùng khoảng thời gian này.'
                    });
                }

                const checkTrainerOverlap = (cb) => {
                    if (!trainerId) return cb(null);
                    conn.query(
                        `SELECT id FROM bookings
                         WHERE trainer_id = ? AND status = 'booked'
                           AND start_time < ? AND end_time > ?
                         LIMIT 1
                         FOR UPDATE`,
                        [trainerId, endSql, startSql],
                        (err2, trainerRows) => {
                            if (err2) return cb({ http: 500, message: 'Lỗi truy vấn HLV', sqlErr: err2 });
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
                        return fail(conflictErr.http, {
                            status: 'Conflict',
                            message: conflictErr.message
                        }, conflictErr.sqlErr);
                    }

                    conn.query(
                        `INSERT INTO bookings (member_id, trainer_id, start_time, end_time, title, note, status)
                         VALUES (?, ?, ?, ?, ?, ?, 'booked')`,
                        [targetMemberId, trainerId, startSql, endSql, finalTitle, finalNote],
                        (err3, result) => {
                            if (err3) return fail(500, { status: 'Error', message: 'Lỗi lưu lịch' }, err3);
                            conn.commit((errCommit) => {
                                if (errCommit) return fail(500, { status: 'Error', message: 'Lỗi commit' }, errCommit);
                                conn.release();
                                res.status(201).json({
                                    status: 'Success',
                                    booking_id: result.insertId,
                                    message: 'Đã đặt lịch thành công!'
                                });
                            });
                        }
                    );
                });
            });
        });
    });
});

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
