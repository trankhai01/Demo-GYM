const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    res.render('checkin/index');
});

router.post('/process', (req, res) => {
    const searchVal = req.body.search_val || req.body.member_id;
    
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
            if (!regs || regs.length === 0) {
                return res.json({ 
                    status: 'Expired', 
                    member: member, 
                    expiration_date: null,
                    message: 'Thẻ đã hết hạn hoặc chưa đăng ký gói.'
                });
            }

            res.json({ 
                status: 'Success', 
                member: member, 
                expiration_date: regs[0].expiration_date,
                message: 'Hợp lệ. Vui lòng bấm Xác nhận!'
            });
        });
    });
});

router.post('/confirm', (req, res) => {
    const { member_id } = req.body;
    
    db.query("INSERT INTO checkin_history (member_id, status, note) VALUES (?, 'Success', 'Hợp lệ')", [member_id], (err) => {
        if (err) return res.status(500).json({ status: 'Error', message: 'Lỗi lưu lịch sử' });
        
        res.json({ status: 'Success', message: 'Đã lưu lịch sử check-in thành công!' });
    });
});

module.exports = router;