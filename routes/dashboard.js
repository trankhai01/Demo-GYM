const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireMember } = require('../middleware/auth');

router.get('/', requireMember, (req, res) => {
    const memberId = req.session.user.id;

    const sqlMember = "SELECT id, fullname, phone, gender, join_date, avatar_url FROM members WHERE id = ?";
    // Chỉ tính gói đã thanh toán (Success); Pending không được xem như active.
    const sqlActivePackage = `
        SELECT r.id, r.expiration_date, r.total_sessions, r.used_sessions,
               r.registration_date, p.package_name,
               DATEDIFF(r.expiration_date, CURRENT_DATE()) AS days_left
        FROM registrations r
        LEFT JOIN packages p ON r.package_id = p.id
        WHERE r.member_id = ? AND r.status = 'active' AND r.payment_status = 'Success'
          AND (r.expiration_date IS NULL OR r.expiration_date >= CURRENT_DATE())
        ORDER BY r.expiration_date DESC LIMIT 1
    `;
    const sqlUpcoming = `
        SELECT b.id, b.start_time, b.end_time, b.title, b.note,
               t.fullname AS trainer_name
        FROM bookings b
        LEFT JOIN trainers t ON b.trainer_id = t.id
        WHERE b.member_id = ? AND b.status = 'booked'
          AND b.end_time >= NOW()
        ORDER BY b.start_time ASC LIMIT 5
    `;
    const sqlRecentCheckins = `
        SELECT id, checkin_time, checkout_time,
               TIMESTAMPDIFF(MINUTE, checkin_time, COALESCE(checkout_time, NOW())) AS duration_min
        FROM checkin_history
        WHERE member_id = ? AND status = 'Success'
        ORDER BY checkin_time DESC LIMIT 5
    `;
    const sqlStats = `
        SELECT
            (SELECT COUNT(*) FROM checkin_history
             WHERE member_id = ? AND status = 'Success') AS total_checkins,
            (SELECT COUNT(*) FROM bookings
             WHERE member_id = ? AND status = 'booked' AND end_time >= NOW()) AS upcoming_count
    `;

    db.query(sqlMember, [memberId], (err, memberRows) => {
        if (err || memberRows.length === 0) {
            console.error('[dashboard] member:', err && err.message);
            return res.status(500).render('error', { message: 'Lỗi tải hồ sơ.' });
        }
        db.query(sqlActivePackage, [memberId], (err2, pkgRows) => {
            if (err2) {
                console.error('[dashboard] package:', err2.message);
                return res.status(500).render('error', { message: 'Lỗi tải gói tập.' });
            }
            db.query(sqlUpcoming, [memberId], (err3, upcoming) => {
                if (err3) {
                    console.error('[dashboard] upcoming:', err3.message);
                    return res.status(500).render('error', { message: 'Lỗi tải lịch sắp tới.' });
                }
                db.query(sqlRecentCheckins, [memberId], (err4, recent) => {
                    if (err4) {
                        console.error('[dashboard] recent:', err4.message);
                        return res.status(500).render('error', { message: 'Lỗi tải lịch sử.' });
                    }
                    db.query(sqlStats, [memberId, memberId], (err5, statsRows) => {
                        if (err5) {
                            console.error('[dashboard] stats:', err5.message);
                            return res.status(500).render('error', { message: 'Lỗi tải thống kê.' });
                        }
                        res.render('dashboard', {
                            user: req.session.user,
                            member: memberRows[0],
                            activePackage: pkgRows.length > 0 ? pkgRows[0] : null,
                            upcomingBookings: upcoming,
                            recentCheckins: recent,
                            stats: statsRows[0] || { total_checkins: 0, upcoming_count: 0 }
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
