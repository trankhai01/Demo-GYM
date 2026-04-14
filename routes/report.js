const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send("Bạn không có quyền truy cập trang này!");
    }
}

router.get('/revenue', requireAdmin, (req, res) => {
    const sql = `
        SELECT MONTH(payment_date) AS month, SUM(amount) AS total_revenue
        FROM payments
        WHERE YEAR(payment_date) = YEAR(CURRENT_DATE)
        GROUP BY MONTH(payment_date)
        ORDER BY MONTH(payment_date)
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Lỗi truy vấn SQL: ", err);
            return res.status(500).send("Lỗi server");
        }
        let monthlyData = new Array(12).fill(0);
        results.forEach(row => {
            monthlyData[row.month - 1] = row.total_revenue;
        });
        res.render('reports/revenue', { 
            chartData: JSON.stringify(monthlyData),
            currentYear: new Date().getFullYear()
        });
    });
});

module.exports = router;