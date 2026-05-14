const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff} = require('../middleware/auth');

function parsePackagePayload(body) {
    const packageName = String(body.package_name || '').trim();
    const durationMonths = Number(body.duration_months);
    const price = Number(body.price);
    const ptSessions = Number(body.pt_sessions || 0);
    const description = String(body.description || '').trim();

    if (!packageName) return { error: 'Vui lòng nhập tên gói tập.' };
    if (!Number.isInteger(durationMonths) || durationMonths <= 0) return { error: 'Thời hạn gói tập không hợp lệ.' };
    if (!Number.isFinite(price) || price < 0) return { error: 'Giá gói tập không hợp lệ.' };
    if (!Number.isInteger(ptSessions) || ptSessions < 0) return { error: 'Số buổi PT không hợp lệ.' };

    return { packageName, durationMonths, price, description, ptSessions };
}

router.get('/', requireStaff, (req, res) => {
    db.query("SELECT * FROM packages ORDER BY price ASC", (err, results) => {
        if (err) return res.status(500).send("Lỗi server");
        res.render('packages/index', { packages: results || [] });
    });
});

router.get('/add',requireStaff, (req, res) => {
    res.render('packages/add');
});
router.get('/edit/:id',requireStaff, (req, res) => {
    db.query("SELECT * FROM packages WHERE id = ?", [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/packages');
        res.render('packages/edit', { pkg: result[0] });
    });
});

router.post('/add',requireStaff, (req, res) => {
    const payload = parsePackagePayload(req.body);
    if (payload.error) return res.status(400).send(payload.error);
    
    db.query("INSERT INTO packages (package_name, duration_months, price, description, pt_sessions) VALUES (?, ?, ?, ?, ?)", 
    [payload.packageName, payload.durationMonths, payload.price, payload.description, payload.ptSessions], (err) => {
        if (err) return res.status(500).send("Lỗi thêm dữ liệu");
        res.redirect('/packages');
    });
});

router.post('/edit/:id',requireStaff, (req, res) => {
    const payload = parsePackagePayload(req.body);
    if (payload.error) return res.status(400).send(payload.error);
    
    db.query("UPDATE packages SET package_name = ?, duration_months = ?, price = ?, description = ?, pt_sessions = ? WHERE id = ?", 
    [payload.packageName, payload.durationMonths, payload.price, payload.description, payload.ptSessions, req.params.id], (err) => {
        if (err) return res.status(500).send("Lỗi cập nhật dữ liệu");
        res.redirect('/packages');
    });
});

router.post('/delete/:id', requireStaff, (req, res) => {
    db.query("DELETE FROM packages WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.redirect('/packages?notice=delete_in_use');
            }
            console.error('[packages/delete]', err.message);
            return res.redirect('/packages?notice=delete_error');
        }
        res.redirect('/packages?notice=delete_success');
    });
});

module.exports = router;
