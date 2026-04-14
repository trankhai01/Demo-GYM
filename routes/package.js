const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const sql = "SELECT * FROM packages ORDER BY price ASC";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send("Lỗi truy vấn gói tập: " + err.message);
        }
        res.render('packages/index', { packages: results });
    });
});

router.post('/add', (req, res) => {
    const { package_name, price, duration_days } = req.body;
    const sql = "INSERT INTO packages (package_name, price, duration_days) VALUES (?, ?, ?)";
    
    db.query(sql, [package_name, price, duration_days], (err, result) => {
        if (err) {
            return res.status(500).send("Lỗi khi lưu gói tập: " + err.message);
        }
        res.redirect('/packages');
    });
});

router.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM packages WHERE id = ?";
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).send("Không thể xóa gói tập này vì đang có người dùng!");
        res.redirect('/packages');
    });
});

module.exports = router;