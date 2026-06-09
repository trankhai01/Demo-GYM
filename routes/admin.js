const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const { STATUS } = require('../lib/status');
const auditLog = require('../lib/auditLog');
const systemSettings = require('../lib/systemSettings');

const ACTION_LABELS = {
    'product.delete': 'Xóa sản phẩm',
    'trainer.delete': 'Xóa huấn luyện viên',
    'package.delete': 'Xóa gói tập',
    'member.delete': 'Xóa hội viên',
    'pt_session.deduct': 'Trừ buổi PT',
    'invoice.cancel': 'Hủy hóa đơn',
    'invoice.confirm_payment': 'Xác nhận thanh toán',
    'settings.update': 'Cập nhật cấu hình'
};

const ENTITY_LABELS = {
    product: 'Sản phẩm',
    trainer: 'Huấn luyện viên',
    package: 'Gói tập',
    member: 'Hội viên',
    registration: 'Hóa đơn/đăng ký',
    system_settings: 'Cấu hình hệ thống'
};

const META_LABELS = {
    image_url: 'Ảnh',
    member_id: 'Hội viên ID',
    trainer_id: 'HLV ID',
    note: 'Ghi chú',
    discount_code_id: 'Mã ưu đãi ID',
    payment_method: 'Phương thức thanh toán',
    product_count: 'Số dòng sản phẩm',
    changed_fields: 'Trường đã đổi'
};

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

function isDateOnly(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function parseMetadata(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (e) {
        return { raw: String(value) };
    }
}

function describeMetadata(value) {
    const data = parseMetadata(value);
    if (!data || Object.keys(data).length === 0) return [];
    return Object.entries(data).map(([key, val]) => ({
        label: META_LABELS[key] || key,
        value: Array.isArray(val)
            ? (val.length ? val.join(', ') : 'Không thay đổi')
            : (val == null || val === '' ? '---' : String(val))
    }));
}

function enrichAuditLog(log) {
    return {
        ...log,
        action_label: ACTION_LABELS[log.action] || log.action,
        entity_label: ENTITY_LABELS[log.entity_type] || log.entity_type,
        detail_rows: describeMetadata(log.metadata)
    };
}

/* Dashboard admin */
router.get('/', requireAdmin, async (req, res) => {
    try {
        const queries = {
            todayRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = ? AND DATE(registration_date) = CURRENT_DATE()`,
                [STATUS.PAYMENT.SUCCESS]
            ],
            yesterdayRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = ?
                   AND DATE(registration_date) = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)`,
                [STATUS.PAYMENT.SUCCESS]
            ],
            weekRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = ?
                   AND registration_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)`,
                [STATUS.PAYMENT.SUCCESS]
            ],
            monthRevenue: [
                `SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)), 0) AS total
                 FROM registrations
                 WHERE payment_status = ?
                   AND MONTH(registration_date) = MONTH(CURRENT_DATE())
                   AND YEAR(registration_date) = YEAR(CURRENT_DATE())`,
                [STATUS.PAYMENT.SUCCESS]
            ],
            todayCheckins: [
                `SELECT COUNT(*) AS cnt FROM checkin_history
                 WHERE DATE(checkin_time) = CURRENT_DATE() AND status = ?`,
                [STATUS.CHECKIN.SUCCESS]
            ],
            currentlyInside: [
                `SELECT COUNT(*) AS cnt FROM checkin_history
                 WHERE checkout_time IS NULL AND status = ?
                   AND DATE(checkin_time) = CURRENT_DATE()`,
                [STATUS.CHECKIN.SUCCESS]
            ],
            todayNewMembers: [
                `SELECT COUNT(*) AS cnt FROM members WHERE DATE(join_date) = CURRENT_DATE()`
            ],
            totalMembers: [
                `SELECT COUNT(*) AS cnt FROM members WHERE role = 'member'`
            ],
            todayOrders: [
                `SELECT COUNT(*) AS cnt FROM registrations
                 WHERE DATE(registration_date) = CURRENT_DATE()`
            ],
            topPackages: [
                `SELECT p.id, p.package_name, COUNT(r.id) AS sold,
                        COALESCE(SUM(r.price - COALESCE(r.discount_amount,0)),0) AS revenue
                 FROM registrations r
                 JOIN packages p ON p.id = r.package_id
                 WHERE r.payment_status = ?
                   AND MONTH(r.registration_date) = MONTH(CURRENT_DATE())
                   AND YEAR(r.registration_date) = YEAR(CURRENT_DATE())
                 GROUP BY p.id, p.package_name
                 ORDER BY sold DESC LIMIT 5`,
                [STATUS.PAYMENT.SUCCESS]
            ],
            topProducts: [
                `SELECT pr.id, pr.product_name, pr.image_url,
                        COALESCE(SUM(rd.quantity), 0) AS qty_sold,
                        COALESCE(SUM(rd.quantity * rd.price), 0) AS revenue
                 FROM registration_details rd
                 JOIN products pr ON pr.id = rd.product_id
                 JOIN registrations r ON r.id = rd.registration_id
                 WHERE r.payment_status = ?
                   AND MONTH(r.registration_date) = MONTH(CURRENT_DATE())
                   AND YEAR(r.registration_date) = YEAR(CURRENT_DATE())
                 GROUP BY pr.id, pr.product_name, pr.image_url
                 ORDER BY qty_sold DESC LIMIT 5`,
                [STATUS.PAYMENT.SUCCESS]
            ],
            chart7days: [
                `SELECT DATE_FORMAT(registration_date, '%Y-%m-%d') AS d,
                        COALESCE(SUM(price - COALESCE(discount_amount,0)),0) AS revenue
                 FROM registrations
                 WHERE payment_status = ?
                   AND registration_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
                 GROUP BY DATE_FORMAT(registration_date, '%Y-%m-%d')
                 ORDER BY d ASC`,
                [STATUS.PAYMENT.SUCCESS]
            ],
            todayBookings: [
                `SELECT b.id, b.start_time, b.end_time, b.title, b.status,
                        m.fullname AS member_name,
                        t.fullname AS trainer_name
                 FROM bookings b
                 LEFT JOIN members m ON m.id = b.member_id
                 LEFT JOIN trainers t ON t.id = b.trainer_id
                 WHERE DATE(b.start_time) = CURRENT_DATE()
                   AND b.status = ?
                 ORDER BY b.start_time ASC`,
                [STATUS.BOOKING.BOOKED]
            ],
            lowStock: [
                `SELECT id, product_name, stock_quantity, image_url
                 FROM products
                 WHERE stock_quantity <= 5 AND status = ?
                 ORDER BY stock_quantity ASC LIMIT 6`,
                [STATUS.INVENTORY.ACTIVE]
            ],
            unreadMsgs: [
                `SELECT COUNT(*) AS cnt FROM contact_messages WHERE is_read = 0`
            ],
            expiringPackages: [
                `SELECT r.id, m.id AS member_id, m.fullname, p.package_name,
                        r.expiration_date,
                        DATEDIFF(r.expiration_date, CURRENT_DATE()) AS days_left
                 FROM registrations r
                 JOIN members m ON m.id = r.member_id
                 JOIN packages p ON p.id = r.package_id
                 WHERE r.payment_status = ? AND r.status = ?
                   AND r.expiration_date IS NOT NULL
                   AND r.expiration_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
                 ORDER BY r.expiration_date ASC LIMIT 6`,
                [STATUS.PAYMENT.SUCCESS, STATUS.REGISTRATION.ACTIVE]
            ],
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

        const todayRev = Number(r.todayRevenue[0].total) || 0;
        const yesterdayRev = Number(r.yesterdayRevenue[0].total) || 0;
        let revGrowth = 0;
        if (yesterdayRev > 0) {
            revGrowth = ((todayRev - yesterdayRev) / yesterdayRev) * 100;
        } else if (todayRev > 0) {
            revGrowth = 100;
        }

        const pad = n => String(n).padStart(2, '0');
        const chart7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
            const found = r.chart7days.find(row => String(row.d).slice(0, 10) === ymd);
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

router.get('/audit', requireAdmin, (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 25;
    const offset = (page - 1) * limit;
    const action = String(req.query.action || '').trim();
    const entity = String(req.query.entity || '').trim();
    const actor = String(req.query.actor || '').trim();
    const from = isDateOnly(req.query.from) ? String(req.query.from) : '';
    const to = isDateOnly(req.query.to) ? String(req.query.to) : '';

    const where = [];
    const params = [];

    if (action) {
        where.push('action = ?');
        params.push(action);
    }
    if (entity) {
        where.push('entity_type = ?');
        params.push(entity);
    }
    if (actor) {
        where.push('(actor_name LIKE ? OR CAST(actor_id AS CHAR) = ?)');
        params.push(`%${actor}%`, actor);
    }
    if (from) {
        where.push('created_at >= ?');
        params.push(`${from} 00:00:00`);
    }
    if (to) {
        where.push('created_at <= ?');
        params.push(`${to} 23:59:59`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countSql = `SELECT COUNT(*) AS total FROM audit_logs ${whereSql}`;
    const dataSql = `
        SELECT id, actor_id, actor_name, actor_role, action, entity_type, entity_id,
               metadata, ip_address, created_at
        FROM audit_logs
        ${whereSql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
    `;
    const actionOptionsSql = 'SELECT DISTINCT action FROM audit_logs ORDER BY action ASC';
    const entityOptionsSql = 'SELECT DISTINCT entity_type FROM audit_logs ORDER BY entity_type ASC';

    db.query(countSql, params, (errCount, countRows) => {
        if (errCount) {
            console.error('[admin/audit count]', errCount.message);
            return res.status(500).render('error', { message: 'Lỗi tải nhật ký thao tác.' });
        }

        db.query(dataSql, [...params, limit, offset], (errData, logs) => {
            if (errData) {
                console.error('[admin/audit data]', errData.message);
                return res.status(500).render('error', { message: 'Lỗi tải nhật ký thao tác.' });
            }

            db.query(actionOptionsSql, (errActions, actionRows) => {
                if (errActions) console.error('[admin/audit action options]', errActions.message);
                db.query(entityOptionsSql, (errEntities, entityRows) => {
                    if (errEntities) console.error('[admin/audit entity options]', errEntities.message);
                    const totalRecords = Number(countRows[0]?.total) || 0;
                    res.render('admin/audit', {
                        logs: (logs || []).map(enrichAuditLog),
                        filters: { action, entity, actor, from, to },
                        actions: actionRows ? actionRows.map(r => r.action) : [],
                        entities: entityRows ? entityRows.map(r => r.entity_type) : [],
                        actionLabels: ACTION_LABELS,
                        entityLabels: ENTITY_LABELS,
                        currentPage: page,
                        totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
                        totalRecords
                    });
                });
            });
        });
    });
});

router.get('/settings', requireAdmin, (req, res) => {
    systemSettings.load((err, settings) => {
        if (err) console.error('[admin/settings load]', err.message);
        res.render('admin/settings', {
            settings,
            success: req.query.success === '1',
            error: null
        });
    });
});

router.post('/settings', requireAdmin, (req, res) => {
    const values = {
        gym_name: String(req.body.gym_name || '').trim(),
        hotline: String(req.body.hotline || '').trim(),
        zalo_phone: String(req.body.zalo_phone || '').trim(),
        email: String(req.body.email || '').trim(),
        address: String(req.body.address || '').trim(),
        opening_hours: String(req.body.opening_hours || '').trim(),
        bank_bin: String(req.body.bank_bin || '').trim().toLowerCase(),
        bank_account: String(req.body.bank_account || '').trim(),
        bank_account_name: String(req.body.bank_account_name || '').trim(),
        map_embed_url: String(req.body.map_embed_url || '').trim()
    };

    if (!values.gym_name || !values.hotline || !values.email || !values.bank_bin || !values.bank_account || !values.bank_account_name) {
        return res.status(400).render('admin/settings', {
            settings: systemSettings.viewModel(values),
            success: false,
            error: 'Vui lòng nhập đủ thông tin liên hệ và tài khoản nhận chuyển khoản.'
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        return res.status(400).render('admin/settings', {
            settings: systemSettings.viewModel(values),
            success: false,
            error: 'Email không hợp lệ.'
        });
    }

    const changedFields = Object.keys(values).filter(key => {
        return String(res.locals.systemSettings[key] || '') !== String(values[key] || '');
    });

    systemSettings.updateMany(values, (err) => {
        if (err) {
            console.error('[admin/settings update]', err.message);
            return res.status(500).render('admin/settings', {
                settings: systemSettings.viewModel(values),
                success: false,
                error: 'Lỗi lưu cấu hình hệ thống.'
            });
        }
        auditLog.record(req, 'settings.update', 'system_settings', 'global', {
            changed_fields: changedFields
        });
        res.redirect('/admin/settings?success=1');
    });
});

module.exports = router;
