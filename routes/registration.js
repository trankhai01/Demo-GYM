const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/add', (req, res) => {
    const sqlMembers = "SELECT * FROM members";
    const sqlPackages = "SELECT * FROM packages";

    db.query(sqlMembers, (err, members) => {
        db.query(sqlPackages, (err, packages) => {
            res.render('registrations/add', { members, packages });
        });
    });
});

router.post('/add', (req, res) => {
    const { member_id, package_id } = req.body;
    db.query("SELECT duration_days FROM packages WHERE id = ?", [package_id], (err, result) => {
        const days = result[0].duration_days;

        let expDate = new Date();
        expDate.setDate(expDate.getDate() + days);

        const sql = "INSERT INTO registrations (member_id, package_id, expiration_date, status) VALUES (?, ?, ?, 'Active')";
        db.query(sql, [member_id, package_id, expDate], (err) => {
            if (err) throw err;
            res.redirect('/members'); 
        });
    });
});

module.exports = router;