const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff} = require('../middleware/auth');

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
    const { package_name, duration_months, price, description, pt_sessions } = req.body;
    
    db.query("INSERT INTO packages (package_name, duration_months, price, description, pt_sessions) VALUES (?, ?, ?, ?, ?)", 
    [package_name, duration_months, price, description, pt_sessions || 0], (err) => {
        if (err) return res.status(500).send("Lỗi thêm dữ liệu");
        res.redirect('/packages');
    });
});

router.post('/edit/:id',requireStaff, (req, res) => {
    const { package_name, duration_months, price, description, pt_sessions } = req.body;
    
    db.query("UPDATE packages SET package_name = ?, duration_months = ?, price = ?, description = ?, pt_sessions = ? WHERE id = ?", 
    [package_name, duration_months, price, description, pt_sessions || 0, req.params.id], (err) => {
        if (err) return res.status(500).send("Lỗi cập nhật dữ liệu");
        res.redirect('/packages');
    });
});

router.post('/delete/:id', requireStaff, (req, res) => {
    db.query("DELETE FROM packages WHERE id = ?", [req.params.id], (err, result) => {
        if (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.send("<script>alert('KHÔNG THỂ XÓA! Đang có hội viên sử dụng gói tập này.'); window.location.href='/packages';</script>");
            }
            return res.status(500).send("Lỗi hệ thống");
        }
        res.redirect('/packages');
    });
});

module.exports = router;