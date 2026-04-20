const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Render giao diện Check-in
router.get('/', (req, res) => {
    res.render('checkin/index');
});

// 2. API Xử lý khi Lễ tân gõ SĐT hoặc ID (Dùng Fetch API)
router.post('/process', (req, res) => {
    const searchVal = req.body.search_val;
    db.query("SELECT * FROM members WHERE phone = ? OR id = ?", [searchVal, searchVal], (err, members) => {
        if (err || members.length === 0) {
            return res.json({ status: 'Not Found', message: 'Không tìm thấy hội viên trong hệ thống!' });
        }
        const member = members[0];
        const sqlCheckPackage = `
            SELECT expiration_date, package_id 
            FROM registrations 
            WHERE member_id = ? AND status = 'active' AND expiration_date >= CURRENT_DATE()
            ORDER BY expiration_date DESC LIMIT 1
        `;

        db.query(sqlCheckPackage, [member.id], (err, regs) => {
            let checkinStatus = 'Expired'; 
            let expDate = null;
            let note = 'Thẻ đã hết hạn hoặc chưa đăng ký gói.';

            if (regs && regs.length > 0) {
                checkinStatus = 'Success'; 
                expDate = regs[0].expiration_date;
                note = 'Hợp lệ';
            }
            db.query("INSERT INTO checkin_history (member_id, status, note) VALUES (?, ?, ?)", 
            [member.id, checkinStatus, note], (err) => {
                res.json({
                    status: checkinStatus,
                    member: member,
                    expiration_date: expDate
                });
            });
        });
    });
});

module.exports = router;