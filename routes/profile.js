const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware chặn: Chỉ khách hàng mới được vào
function requireMember(req, res, next) {
    if (req.session.user && req.session.user.role === 'member') {
        next();
    } else {
        res.redirect('/login');
    }
}

// Trang Dashboard cá nhân
router.get('/', requireMember, (req, res) => {
    const memberId = req.session.user.id;

    // Câu lệnh SQL "khét" nhất: Nối bảng để tìm gói tập mới nhất của người này
    const sql = `
        SELECT p.package_name, r.expiration_date, r.status 
        FROM registrations r
        JOIN packages p ON r.package_id = p.id
        WHERE r.member_id = ? 
        ORDER BY r.id DESC LIMIT 1
    `;

    db.query(sql, [memberId], (err, results) => {
        if (err) throw err;
        
        // Nếu có kết quả thì gán vào biến, không thì gán null
        const currentPackage = results.length > 0 ? results[0] : null;
        
        res.render('profile/index', { package: currentPackage });
    });
});

module.exports = router;