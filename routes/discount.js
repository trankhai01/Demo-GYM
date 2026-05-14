const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff } = require('../middleware/auth');
const { STATUS, normalizeDiscountStatus } = require('../lib/status');

router.use(requireStaff);

router.get('/', (req, res) => {
    const sql = `
        SELECT dc.*, m.fullname AS member_name
        FROM discount_codes dc
        LEFT JOIN members m ON m.id = dc.member_id
        ORDER BY dc.id DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).render('error', { message: 'Lỗi tải danh sách mã ưu đãi.' });
        res.render('discounts/index', { codes: rows || [] });
    });
});

router.get('/add', (req, res) => {
    res.render('discounts/add', { error: null, form: {} });
});

function isDateOnly(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function parseDiscountPayload(body, options = {}) {
    const {
        code, description, discount_type, discount_value,
        min_amount, max_discount, valid_from, valid_to,
        usage_limit, status
    } = body;

    const cleanCode = String(code || '').trim().toUpperCase();
    if (options.requireCode !== false) {
        if (!cleanCode) return { error: 'Vui lòng nhập mã ưu đãi.' };
        if (!/^[A-Z0-9_-]{3,40}$/.test(cleanCode)) {
            return { error: 'Mã ưu đãi chỉ dùng chữ, số, gạch ngang/gạch dưới và dài 3-40 ký tự.' };
        }
    }

    const type = discount_type === 'fixed' ? 'fixed' : 'percent';
    const value = Number(discount_value);
    const minAmount = Number(min_amount || 0);
    const maxDiscount = max_discount === '' || max_discount == null ? null : Number(max_discount);
    const usageLimit = usage_limit === '' || usage_limit == null ? null : Number(usage_limit);
    const validFrom = valid_from || null;
    const validTo = valid_to || null;

    if (!Number.isFinite(value) || value <= 0) return { error: 'Giá trị giảm phải lớn hơn 0.' };
    if (type === 'percent' && value > 100) return { error: 'Mã giảm theo phần trăm không được vượt quá 100%.' };
    if (!Number.isFinite(minAmount) || minAmount < 0) return { error: 'Đơn tối thiểu không hợp lệ.' };
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) return { error: 'Giảm tối đa không hợp lệ.' };
    if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit <= 0)) return { error: 'Giới hạn số lần dùng không hợp lệ.' };
    if (validFrom && !isDateOnly(validFrom)) return { error: 'Ngày bắt đầu không hợp lệ.' };
    if (validTo && !isDateOnly(validTo)) return { error: 'Ngày kết thúc không hợp lệ.' };
    if (validFrom && validTo && validFrom > validTo) return { error: 'Ngày kết thúc phải sau ngày bắt đầu.' };

    return {
        code: cleanCode,
        description: String(description || '').trim() || null,
        discountType: type,
        discountValue: value,
        minAmount,
        maxDiscount: type === 'percent' ? maxDiscount : null,
        validFrom,
        validTo,
        usageLimit,
        status: normalizeDiscountStatus(status)
    };
}

router.post('/add', (req, res) => {
    const payload = parseDiscountPayload(req.body);
    if (payload.error) {
        return res.status(400).render('discounts/add', { error: payload.error, form: req.body });
    }

    const params = [
        payload.code,
        payload.description,
        payload.discountType,
        payload.discountValue,
        payload.minAmount,
        payload.maxDiscount,
        payload.validFrom,
        payload.validTo,
        payload.usageLimit,
        payload.status
    ];
    const sql = `INSERT INTO discount_codes
        (code, description, discount_type, discount_value, min_amount, max_discount, valid_from, valid_to, usage_limit, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, params, (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.redirect('/discounts/add?error=duplicate');
            console.error('[discounts/add]', err.message);
            return res.status(500).render('error', { message: 'Lỗi thêm mã ưu đãi.' });
        }
        res.redirect('/discounts');
    });
});

router.get('/edit/:id', (req, res) => {
    db.query('SELECT * FROM discount_codes WHERE id = ?', [req.params.id], (err, rows) => {
        if (err || !rows.length) return res.redirect('/discounts');
        res.render('discounts/edit', { code: rows[0] });
    });
});

router.post('/edit/:id', (req, res) => {
    const payload = parseDiscountPayload(req.body, { requireCode: false });
    if (payload.error) {
        return db.query('SELECT * FROM discount_codes WHERE id = ?', [req.params.id], (err, rows) => {
            const code = { ...(rows && rows[0] ? rows[0] : { id: req.params.id }), ...req.body };
            res.status(400).render('discounts/edit', { code, error: payload.error });
        });
    }

    const params = [
        payload.description,
        payload.discountType,
        payload.discountValue,
        payload.minAmount,
        payload.maxDiscount,
        payload.validFrom,
        payload.validTo,
        payload.usageLimit,
        payload.status,
        req.params.id
    ];
    const sql = `UPDATE discount_codes SET
        description = ?, discount_type = ?, discount_value = ?,
        min_amount = ?, max_discount = ?, valid_from = ?, valid_to = ?,
        usage_limit = ?, status = ?
        WHERE id = ?`;
    db.query(sql, params, (err) => {
        if (err) {
            console.error('[discounts/edit]', err.message);
            return res.status(500).render('error', { message: 'Lỗi cập nhật mã ưu đãi.' });
        }
        res.redirect('/discounts');
    });
});

router.post('/delete/:id', (req, res) => {
    db.query('DELETE FROM discount_codes WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            console.error('[discounts/delete]', err.message);
            return res.redirect('/discounts?notice=delete_error');
        }
        res.redirect('/discounts?notice=delete_success');
    });
});

router.post('/api/validate', express.json(), (req, res) => {
    const code = String(req.body.code || '').trim().toUpperCase();
    const amount = Number(req.body.amount || 0);
    const memberId = req.body.member_id ? Number(req.body.member_id) : null;
    if (!code) return res.json({ ok: false, error: 'Vui lòng nhập mã.' });
    if (!Number.isFinite(amount) || amount <= 0) return res.json({ ok: false, error: 'Số tiền không hợp lệ.' });

    db.query('SELECT * FROM discount_codes WHERE code = ?', [code], (err, rows) => {
        if (err) return res.json({ ok: false, error: 'Lỗi máy chủ.' });
        if (!rows.length) return res.json({ ok: false, error: 'Mã không tồn tại.' });
        const dc = rows[0];
        const result = computeDiscount(dc, amount, memberId);
        if (!result.ok) return res.json(result);
        res.json({
            ok: true,
            id: dc.id,
            code: dc.code,
            description: dc.description,
            discount_amount: result.discount_amount,
            final_amount: Math.max(0, amount - result.discount_amount)
        });
    });
});

function computeDiscount(dc, amount, memberId) {
    const invoiceAmount = Number(amount);
    const discountValue = Number(dc.discount_value);
    if (!Number.isFinite(invoiceAmount) || invoiceAmount <= 0) return { ok: false, error: 'Số tiền không hợp lệ.' };
    if (!Number.isFinite(discountValue) || discountValue <= 0) return { ok: false, error: 'Giá trị mã ưu đãi không hợp lệ.' };
    if (dc.discount_type === 'percent' && discountValue > 100) return { ok: false, error: 'Giá trị mã ưu đãi không hợp lệ.' };
    if (dc.status !== STATUS.DISCOUNT.ACTIVE) return { ok: false, error: 'Mã đã ngừng hoạt động.' };
    const today = new Date().toISOString().slice(0, 10);
    if (dc.valid_from && today < String(dc.valid_from).slice(0, 10)) return { ok: false, error: 'Mã chưa tới hạn áp dụng.' };
    if (dc.valid_to && today > String(dc.valid_to).slice(0, 10)) return { ok: false, error: 'Mã đã hết hạn.' };
    if (dc.usage_limit !== null && Number(dc.used_count) >= Number(dc.usage_limit)) return { ok: false, error: 'Mã đã hết lượt sử dụng.' };
    if (invoiceAmount < Number(dc.min_amount || 0)) return { ok: false, error: `Hóa đơn cần tối thiểu ${Number(dc.min_amount).toLocaleString('vi-VN')}đ.` };
    if (dc.member_id && memberId && Number(dc.member_id) !== Number(memberId)) return { ok: false, error: 'Mã chỉ dành riêng cho hội viên khác.' };
    if (dc.member_id && !memberId) return { ok: false, error: 'Mã yêu cầu chọn hội viên.' };

    let discount = 0;
    if (dc.discount_type === 'percent') {
        discount = Math.floor((invoiceAmount * discountValue) / 100);
        if (dc.max_discount) discount = Math.min(discount, Number(dc.max_discount));
    } else {
        discount = discountValue;
    }
    discount = Math.max(0, Math.min(discount, invoiceAmount));
    return { ok: true, discount_amount: discount };
}

function applyDiscountTransactional(conn, code, amount, memberId, callback) {
    if (!code) return callback(null, { discount_id: null, discount_amount: 0, final_amount: amount });
    const upper = String(code).trim().toUpperCase();
    conn.query('SELECT * FROM discount_codes WHERE code = ? FOR UPDATE', [upper], (err, rows) => {
        if (err) return callback(err);
        if (!rows.length) return callback(new Error('Mã không tồn tại.'));
        const dc = rows[0];
        const result = computeDiscount(dc, amount, memberId);
        if (!result.ok) return callback(new Error(result.error));
        conn.query('UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?', [dc.id], (err2) => {
            if (err2) return callback(err2);
            callback(null, {
                discount_id: dc.id,
                discount_amount: result.discount_amount,
                final_amount: Math.max(0, amount - result.discount_amount)
            });
        });
    });
}

router.post('/birthday/run', (req, res) => {
    const mailer = require('../lib/mailer');
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const validFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const validTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    db.query(
        `SELECT id, fullname, email FROM members
         WHERE role = 'member'
           AND birth_date IS NOT NULL
           AND MONTH(birth_date) = ?`,
        [month],
        (err, members) => {
            if (err) return res.status(500).render('error', { message: 'Lỗi tải hội viên.' });
            const candidates = members || [];
            let processed = 0, created = 0, mailed = 0;
            const finish = () => res.redirect(`/discounts?birthday_created=${created}&mailed=${mailed}`);
            if (candidates.length === 0) return finish();

            const next = () => {
                if (processed >= candidates.length) return finish();
                const m = candidates[processed++];
                const code = `BDAY-${m.id}-${year}${String(month).padStart(2, '0')}`;
                db.query(
                    `INSERT IGNORE INTO discount_codes
                     (code, description, discount_type, discount_value, min_amount, valid_from, valid_to, usage_limit, is_birthday, member_id, status)
                     VALUES (?, ?, 'percent', 15, 0, ?, ?, 1, 1, ?, ?)`,
                    [code, `Quà sinh nhật tháng ${month} cho ${m.fullname}`, validFrom, validTo, m.id, STATUS.DISCOUNT.ACTIVE],
                    (insErr, result) => {
                        if (insErr) {
                            console.error('[discounts/birthday] insert', insErr.message);
                            return next();
                        }
                        if (result.affectedRows > 0) {
                            created += 1;
                            if (m.email && mailer.isEnabled()) {
                                const tpl = mailer.birthdayCodeTemplate({
                                    fullname: m.fullname,
                                    code,
                                    discountText: 'Giảm 15% cho gói tập tiếp theo',
                                    validTo: new Date(validTo).toLocaleDateString('vi-VN'),
                                    loginUrl: `${req.protocol}://${req.get('host')}/login`
                                });
                                mailer.sendMail({ to: m.email, ...tpl })
                                    .then(() => { mailed += 1; })
                                    .catch((e) => console.error('[discounts/birthday] mail', e.message))
                                    .finally(next);
                                return;
                            }
                        }
                        next();
                    }
                );
            };
            next();
        }
    );
});

module.exports = router;
module.exports.applyDiscountTransactional = applyDiscountTransactional;
module.exports.computeDiscount = computeDiscount;
