const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

/* Helper: chạy nhiều query song song và trả về object kết quả */
function runQueries(jobs) {
    return Promise.all(
        Object.entries(jobs).map(([key, [sql, params]]) =>
            new Promise((resolve, reject) => {
                db.query(sql, params || [], (err, rows) => {
                    if (err) reject(err);
                    else resolve([key, rows]);
                });
            })
        )
    ).then(entries => Object.fromEntries(entries));
}

/* ============================================================
 * Dashboard tổng quan dành cho admin
 * ============================================================ */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const queries = {
            /* Doanh thu hôm nay (registrations đã Success) */
            todayRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = 'Success' AND DATE(registration_date) = CURRENT_DATE()`
            ],
            /* Doanh thu hôm qua (so sánh tăng giảm %) */
            yesterdayRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = 'Success'
                   AND DATE(registration_date) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)`
            ],
            /* Doanh thu tuần này */
            weekRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = 'Success'
                   AND registration_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)`
            ],
            /* Doanh thu tháng này */
            monthRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = 'Success'
                   AND MONTH(registration_date) = MONTH(CURRENT_DATE())
                   AND YEAR(registration_date) = YEAR(CURRENT_DATE())`
            ],
            /* Check-in hôm nay (số phiên) */
            todayCheckins: [
                `SELECT COUNT(*) AS cnt FROM checkin_history
                 WHERE DATE(checkin_time) = CURRENT_DATE() AND status = 'Success'`
            ],
            /* Số người đang trong phòng (chưa checkout) */
            currentlyInside: [
                `SELECT COUNT(*) AS cnt FROM checkin_history
                 WHERE checkout_time IS NULL AND status = 'Success'
                   AND DATE(checkin_time) = CURRENT_DATE()`
            ],
            /* Hội viên mới hôm nay */
            todayNewMembers: [
                `SELECT COUNT(*) AS cnt FROM members WHERE DATE(join_date) = CURRENT_DATE()`
            ],
            /* Tổng hội viên */
            totalMembers: [
                `SELECT COUNT(*) AS cnt FROM members WHERE role = 'member'`
            ],
            /* Đơn (registrations) hôm nay */
            todayOrders: [
                `SELECT COUNT(*) AS cnt FROM registrations
                 WHERE DATE(registration_date) = CURRENT_DATE()`
            ],
            /* Top 5 gói tập bán chạy tháng này */
            topPackages: [
                `SELECT p.id, p.package_name, COUNT(r.id) AS sold,
                        COALESCE(SUM(r.price - COALESCE(r.discount_amount,0)),0) AS revenue
                 FROM registrations r
                 JOIN packages p ON p.id = r.package_id
                 WHERE r.payment_status = 'Success'
                   AND MONTH(r.registration_date) = MONTH(CURRENT_DATE())
                   AND YEAR(r.registration_date) = YEAR(CURRENT_DATE())
                 GROUP BY p.id, p.package_name
                 ORDER BY sold DESC LIMIT 5`
            ],
            /* Top 5 sản phẩm bán chạy tháng này */
            topProducts: [
                `SELECT pr.id, pr.product_name, pr.image_url,
                        COALESCE(SUM(rd.quantity), 0) AS qty_sold,
                        COALESCE(SUM(rd.quantity * rd.price), 0) AS revenue
                 FROM registration_details rd
                 JOIN products pr ON pr.id = rd.product_id
                 JOIN registrations r ON r.id = rd.registration_id
                 WHERE r.payment_status = 'Success'
                   AND MONTH(r.registration_date) = MONTH(CURRENT_DATE())
                   AND YEAR(r.registration_date) = YEAR(CURRENT_DATE())
                 GROUP BY pr.id, pr.product_name, pr.image_url
                 ORDER BY qty_sold DESC LIMIT 5`
            ],
            /* Doanh thu 7 ngày qua (chart) */
            chart7days: [
                `SELECT DATE(registration_date) AS d,
                        COALESCE(SUM(price - COALESCE(discount_amount,0)),0) AS revenue
                 FROM registrations
                 WHERE payment_status = 'Success'
                   AND registration_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
                 GROUP BY DATE(registration_date)
                 ORDER BY d ASC`
            ],
            /* Booking hôm nay (lịch tập) */
            todayBookings: [
                `SELECT b.id, b.start_time, b.end_time, b.title, b.status,
                        m.fullname AS member_name,
                        t.fullname AS trainer_name
                 FROM bookings b
                 LEFT JOIN members m ON m.id = b.member_id
                 LEFT JOIN trainers t ON t.id = b.trainer_id
                 WHERE DATE(b.start_time) = CURRENT_DATE()
                   AND b.status = 'booked'
                 ORDER BY b.start_time ASC`
            ],
            /* CẢNH BÁO 1: SP tồn kho ≤ 5 */
            lowStock: [
                `SELECT id, product_name, stock_quantity, image_url
                 FROM products
                 WHERE stock_quantity <= 5 AND status = 'Active'
                 ORDER BY stock_quantity ASC LIMIT 6`
            ],
            /* CẢNH BÁO 2: Tin nhắn liên hệ chưa đọc */
            unreadMsgs: [
                `SELECT COUNT(*) AS cnt FROM contact_messages WHERE is_read = 0`
            ],
            /* CẢNH BÁO 3: Gói sắp hết hạn (≤ 7 ngày) */
            expiringPackages: [
                `SELECT r.id, m.id AS member_id, m.fullname, p.package_name,
                        r.expiration_date,
                        DATEDIFF(r.expiration_date, CURRENT_DATE()) AS days_left
                 FROM registrations r
                 JOIN members m ON m.id = r.member_id
                 JOIN packages p ON p.id = r.package_id
                 WHERE r.payment_status = 'Success' AND r.status = 'active'
                   AND r.expiration_date IS NOT NULL
                   AND r.expiration_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
                 ORDER BY r.expiration_date ASC LIMIT 6`
            ],
            /* Recent registrations (5 đăng ký gần nhất) */
            recentRegs: [
                `SELECT r.id, r.registration_date, r.price, r.payment_status,
                        m.fullname AS member_name, p.package_name
                 FROM registrations r
                 LEFT JOIN members m ON m.id = r.member_id
                 LEFT JOIN packages p ON p.id = r.package_id
                 WHERE r.package_id IS NOT NULL
                 ORDER BY r.id DESC LIMIT 6`
            ]
        };

        const r = await runQueries(queries);

        /* Tính tăng trưởng % so với hôm qua */
        const todayRev = Number(r.todayRevenue[0].total) || 0;
        const yesterdayRev = Number(r.yesterdayRevenue[0].total) || 0;
        let revGrowth = 0;
        if (yesterdayRev > 0) {
            revGrowth = ((todayRev - yesterdayRev) / yesterdayRev) * 100;
        } else if (todayRev > 0) {
            revGrowth = 100;
        }

        /* Build chart 7 ngày: bù 0 cho ngày không có */
        const chart7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ymd = d.toISOString().slice(0, 10);
            const label = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
            const found = r.chart7days.find(row => {
                /* row.d có thể là Date object hoặc string YYYY-MM-DD */
                const rd = row.d instanceof Date ? row.d.toISOString().slice(0, 10) : String(row.d).slice(0, 10);
                return rd === ymd;
            });
            chart7.push({ label, revenue: found ? Number(found.revenue) : 0 });
        }

        res.render('admin/dashboard', {
            stats: {
                todayRevenue: todayRev,
                yesterdayRevenue: yesterdayRev,
                revGrowth: Math.round(revGrowth * 10) / 10,
                weekRevenue: Number(r.weekRevenue[0].total) || 0,
                monthRevenue: Number(r.monthRevenue[0].total) || 0,
                todayCheckins: r.todayCheckins[0].cnt || 0,
                currentlyInside: r.currentlyInside[0].cnt || 0,
                todayNewMembers: r.todayNewMembers[0].cnt || 0,
                totalMembers: r.totalMembers[0].cnt || 0,
                todayOrders: r.todayOrders[0].cnt || 0,
                unreadMsgs: r.unreadMsgs[0].cnt || 0
            },
            topPackages: r.topPackages || [],
            topProducts: r.topProducts || [],
            chart7,
            todayBookings: r.todayBookings || [],
            lowStock: r.lowStock || [],
            expiringPackages: r.expiringPackages || [],
            recentRegs: r.recentRegs || []
        });
    } catch (err) {
        console.error('[admin/dashboard]', err.message);
        res.status(500).render('error', { message: 'Lỗi tải dashboard quản trị.' });
    }
});

module.exports = router;
