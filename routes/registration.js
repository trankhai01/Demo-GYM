const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Giao diện POS Bán gói
router.get('/', (req, res) => {
    db.query("SELECT id, fullname, phone FROM members ORDER BY id DESC", (err, members) => {
        db.query("SELECT * FROM packages", (err, packages) => {
            db.query("SELECT * FROM trainers", (err, trainers) => {
                res.render('registrations/index', { 
                    members: members || [], 
                    packages: packages || [], 
                    trainers: trainers || [] 
                });
            });
        });
    });
});

// Xử lý lưu hóa đơn
router.post('/add', (req, res) => {
    const { member_id, package_id, trainer_id, schedule } = req.body;
    const reg_date = new Date().toISOString().split('T')[0];

    db.query("SELECT price, duration_months FROM packages WHERE id = ?", [package_id], (err, pkg) => {
        if (err || pkg.length === 0) return res.status(500).send("Lỗi gói tập");
        
        let expDate = new Date();
        expDate.setMonth(expDate.getMonth() + pkg[0].duration_months);
        const exp_date = expDate.toISOString().split('T')[0];
        
        const t_id = trainer_id ? trainer_id : null;
        const price = pkg[0].price;

        const sql = `
            INSERT INTO registrations (member_id, package_id, trainer_id, price, registration_date, expiration_date, schedule, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `;
        
        db.query(sql, [member_id, package_id, t_id, price, reg_date, exp_date, schedule], (err) => {
            if (err) return res.status(500).send("Lỗi lưu hóa đơn");
            res.redirect('/members/view/' + member_id); 
        });
    });
});

router.post('/edit-schedule/:id', (req, res) => {
    const regId = req.params.id;
    const { schedule, member_id } = req.body;

    const sql = "UPDATE registrations SET schedule = ? WHERE id = ?";
    db.query(sql, [schedule, regId], (err, result) => {
        if (err) return res.status(500).send("Lỗi cập nhật lịch tập");
        res.redirect('/members/view/' + member_id);
    });
});

module.exports = router;