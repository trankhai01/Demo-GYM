const express = require('express');
const router = express.Router();
const db = require('../config/db');

function requireMember(req, res, next) {
    if (req.session.user && req.session.user.role === 'member') {
        next();
    } else {
        res.redirect('/login');
    }
}

router.get('/my-profile', requireMember, (req, res) => {
    const memberId = req.session.user.id;
    const sqlMember = "SELECT * FROM members WHERE id = ?";
    const sqlPackage = `
        SELECT p.package_name, r.expiration_date, r.status 
        FROM registrations r
        JOIN packages p ON r.package_id = p.id
        WHERE r.member_id = ? 
        ORDER BY r.id DESC LIMIT 1
    `;

    db.query(sqlMember, [memberId], (err, memberResults) => {
        if (err || memberResults.length === 0) return res.status(500).send("Lỗi tải hồ sơ");

        db.query(sqlPackage, [memberId], (err, packageResults) => {
            if (err) return res.status(500).send("Lỗi tải gói tập");
            
            const currentPackage = packageResults.length > 0 ? packageResults[0] : null;
            res.render('my-profile', { 
                member: memberResults[0],
                activePackage: currentPackage
            });
        });
    });
});

router.post('/my-profile/edit', requireMember, (req, res) => {
    const memberId = req.session.user.id;
    const { 
        fullname, phone, gender, 
        address, cccd, hometown, 
        height, weight, birth_year 
    } = req.body;

    const checkSql = "SELECT id FROM members WHERE phone = ? AND id != ?";
    db.query(checkSql, [phone, memberId], (err, results) => {
        if (err) return res.status(500).send("Lỗi hệ thống");

        if (results.length > 0) {
            return res.redirect('/my-profile?error=duplicate_phone');
        }

        const updateSql = `
            UPDATE members 
            SET fullname = ?, phone = ?, gender = ?, 
                address = ?, cccd = ?, hometown = ?, 
                height = ?, weight = ?, birth_year = ? 
            WHERE id = ?
        `;
        
        const values = [
            fullname, phone, gender, 
            address || null, cccd || null, hometown || null, 
            height || null, weight || null, birth_year || null, 
            memberId
        ];

        db.query(updateSql, values, (err, result) => {
            if (err) return res.status(500).send("Lỗi cập nhật hồ sơ");
            req.session.user.username = fullname;
            res.redirect('/my-profile?success=true');
        });
    });
});
module.exports = router;
module.exports = router;