const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireLogin, requireStaff } = require('../middleware/auth');
const { STATUS } = require('../lib/status');

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
function parseDateRange(start, end) {
    if (!isValidIsoDateTime(start) || !isValidIsoDateTime(end)) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate <= startDate) return null;
    return { startDate, endDate, startSql: toMysqlDateTime(start), endSql: toMysqlDateTime(end) };
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
        db.query(
            "SELECT id, fullname, phone FROM members WHERE role = 'member' ORDER BY fullname",
            (memberErr, members) => {
                res.render('schedule/admin', {
                    trainers: err ? [] : trainers,
                    members: memberErr ? [] : members
                });
            }
        );
    });
});

/* Danh sách HLV theo khung giờ */
router.get('/available-trainers', requireLogin, (req, res) => {
    const { start, end } = req.query;
    const range = parseDateRange(start, end);
    if (!range) {
        return res.status(400).json({ error: 'Tham số start/end không hợp lệ' });
    }

    const sql = `
        SELECT t.id, t.fullname, t.specialty,
               CASE WHEN EXISTS (
                  SELECT 1 FROM bookings b
                  WHERE b.trainer_id = t.id
                    AND b.status = ?
                    AND b.start_time < ?
                    AND b.end_time > ?
               ) THEN 0 ELSE 1 END AS is_available
        FROM trainers t
        WHERE t.status = ?
        ORDER BY is_available DESC, t.fullname
    `;
    db.query(sql, [STATUS.BOOKING.BOOKED, range.endSql, range.startSql, STATUS.TRAINER.ACTIVE], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Lỗi truy vấn' });
        res.json(rows || []);
    });
});

/* Trang lịch của HLV */
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

/* Event lịch của HLV */
router.get('/trainer-events/:id', requireStaff, (req, res) => {
    const trainerId = Number(req.params.id);
    const { start, end } = req.query;
    const range = parseDateRange(start, end);
    if (!Number.isInteger(trainerId) || trainerId <= 0 || !range) {
        return res.status(400).json({ error: 'Tham số không hợp lệ' });
    }
    const sql = `
        SELECT b.id, b.start_time, b.end_time, b.title, b.note, b.status,
               m.id AS member_id, m.fullname AS member_name
        FROM bookings b
        JOIN members m ON b.member_id = m.id
        WHERE b.trainer_id = ?
          AND b.start_time < ? AND b.end_time > ?
          AND b.status IN (?, ?)
        ORDER BY b.start_time
    `;
    db.query(sql, [trainerId, range.endSql, range.startSql, STATUS.BOOKING.BOOKED, STATUS.BOOKING.COMPLETED], (err, rows) => {
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
            color: r.status === STATUS.BOOKING.COMPLETED ? '#10b981' : '#4f46e5'
        }));
        res.json(events);
    });
});

router.get('/events', requireLogin, (req, res) => {
    const role = req.session.user.role;
    const userId = req.session.user.id;
    const { start, end } = req.query;

    const range = parseDateRange(start, end);
    if (!range) {
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
          AND b.status IN (?, ?)
    `;
    const sql = isStaff
        ? baseSql + " ORDER BY b.start_time"
        : baseSql + " AND b.member_id = ? ORDER BY b.start_time";
    const params = isStaff
        ? [range.endSql, range.startSql, STATUS.BOOKING.BOOKED, STATUS.BOOKING.COMPLETED]
        : [range.endSql, range.startSql, STATUS.BOOKING.BOOKED, STATUS.BOOKING.COMPLETED, userId];

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
            color: r.status === STATUS.BOOKING.COMPLETED ? '#198754' : (r.trainer_id ? '#dc3545' : '#0d6efd')
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

    const targetMemberId = isStaff && member_id ? Number(member_id) : Number(userId);
    const trainerId = trainer_id ? Number(trainer_id) : null;
    if (!Number.isInteger(targetMemberId) || targetMemberId <= 0) {
        return res.status(400).json({ status: 'Error', message: 'Hội viên không hợp lệ.' });
    }
    if (trainer_id && (!Number.isInteger(trainerId) || trainerId <= 0)) {
        return res.status(400).json({ status: 'Error', message: 'Huấn luyện viên không hợp lệ.' });
    }
    const finalTitle = ((title && String(title).trim()) || 'Buổi tập').slice(0, 120);
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

            const checkMember = (cb) => {
                conn.query(
                    "SELECT id FROM members WHERE id = ? AND role = 'member' LIMIT 1",
                    [targetMemberId],
                    (errMember, memberRows) => {
                        if (errMember) return cb({ http: 500, message: 'Lỗi kiểm tra hội viên', sqlErr: errMember });
                        if (!memberRows || memberRows.length === 0) {
                            return cb({ http: 404, message: 'Không tìm thấy hội viên.' });
                        }
                        cb(null);
                    }
                );
            };

            const checkTrainer = (cb) => {
                if (!trainerId) return cb(null);
                conn.query(
                    "SELECT id FROM trainers WHERE id = ? AND status = ? LIMIT 1",
                    [trainerId, STATUS.TRAINER.ACTIVE],
                    (errTrainer, trainerRows) => {
                        if (errTrainer) return cb({ http: 500, message: 'Lỗi kiểm tra HLV', sqlErr: errTrainer });
                        if (!trainerRows || trainerRows.length === 0) {
                            return cb({ http: 404, message: 'HLV không tồn tại hoặc đã ngừng dạy.' });
                        }
                        cb(null);
                    }
                );
            };

            const checkActivePackage = (cb) => {
                conn.query(
                    `SELECT id
                     FROM registrations
                     WHERE member_id = ?
                       AND package_id IS NOT NULL
                       AND status = ?
                       AND payment_status = ?
                       AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE())
                     ORDER BY expiration_date DESC, id DESC
                     LIMIT 1`,
                    [targetMemberId, STATUS.REGISTRATION.ACTIVE, STATUS.PAYMENT.SUCCESS],
                    (errPackage, packageRows) => {
                        if (errPackage) return cb({ http: 500, message: 'Lỗi kiểm tra gói tập', sqlErr: errPackage });
                        if (!packageRows || packageRows.length === 0) {
                            return cb({
                                http: 409,
                                message: 'Hội viên chưa có gói tập đã thanh toán nên không thể đặt lịch.'
                            });
                        }
                        cb(null);
                    }
                );
            };

            const checkOverlap = () => {
                const sqlOverlapMember = `
                SELECT id FROM bookings
                WHERE member_id = ? AND status = ?
                  AND start_time < ? AND end_time > ?
                LIMIT 1
                FOR UPDATE
            `;
                conn.query(sqlOverlapMember, [targetMemberId, STATUS.BOOKING.BOOKED, endSql, startSql], (err, rows) => {
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
                         WHERE trainer_id = ? AND status = ?
                           AND start_time < ? AND end_time > ?
                         LIMIT 1
                         FOR UPDATE`,
                        [trainerId, STATUS.BOOKING.BOOKED, endSql, startSql],
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
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [targetMemberId, trainerId, startSql, endSql, finalTitle, finalNote, STATUS.BOOKING.BOOKED],
                        (err3, result) => {
                            if (err3) return fail(500, { status: 'Error', message: 'Lỗi lưu lịch' }, err3);
                            conn.commit((errCommit) => {
                                if (errCommit) return fail(500, { status: 'Error', message: 'Lỗi commit' }, errCommit);
                                conn.release();
                                res.status(201).json({
                                    status: STATUS.API.SUCCESS,
                                    booking_id: result.insertId,
                                    message: 'Đã đặt lịch thành công!'
                                });
                            });
                        }
                    );
                });
            });
            };

            checkMember((memberErr) => {
                if (memberErr) {
                    return fail(memberErr.http, { status: 'Error', message: memberErr.message }, memberErr.sqlErr);
                }
                checkTrainer((trainerErr) => {
                    if (trainerErr) {
                        return fail(trainerErr.http, { status: 'Error', message: trainerErr.message }, trainerErr.sqlErr);
                    }
                    checkActivePackage((packageErr) => {
                        if (packageErr) {
                            return fail(packageErr.http, { status: 'Error', message: packageErr.message }, packageErr.sqlErr);
                        }
                        checkOverlap();
                    });
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
        ? "UPDATE bookings SET status = ? WHERE id = ? AND status = ?"
        : "UPDATE bookings SET status = ? WHERE id = ? AND status = ? AND member_id = ?";
    const params = isStaff
        ? [STATUS.BOOKING.CANCELLED, id, STATUS.BOOKING.BOOKED]
        : [STATUS.BOOKING.CANCELLED, id, STATUS.BOOKING.BOOKED, userId];

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi cập nhật' });
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 'NotFound',
                message: 'Không tìm thấy buổi hoặc buổi đã bị hủy/hoàn thành (hoặc bạn không có quyền).'
            });
        }
        res.json({ status: STATUS.API.SUCCESS, message: 'Đã hủy buổi tập!' });
    });
});

module.exports = router;
