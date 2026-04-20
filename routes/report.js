const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    const currentMonthSql = `
        SELECT 
            SUM(price) as total_revenue, 
            COUNT(id) as total_sold
        FROM registrations 
        WHERE MONTH(registration_date) = MONTH(CURRENT_DATE()) 
        AND YEAR(registration_date) = YEAR(CURRENT_DATE())
    `;

    const chartDataSql = `
        SELECT 
            DATE_FORMAT(registration_date, '%d/%m') as day_month,
            SUM(price) as revenue
        FROM registrations
        WHERE registration_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 9 DAY)
        GROUP BY DATE(registration_date), day_month
        ORDER BY DATE(registration_date) ASC
    `;

    db.query(currentMonthSql, (err, currentResult) => {
        if (err) return res.status(500).send("Lỗi tải dữ liệu");
        
        db.query(chartDataSql, (err, chartResult) => {
            if (err) return res.status(500).send("Lỗi biểu đồ");

            const currentData = currentResult[0] || { total_revenue: 0, total_sold: 0 };
            
            const last10Days = [];
            for (let i = 9; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dayStr = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
                last10Days.push({ day_month: dayStr, revenue: 0 });
            }

            if (chartResult && chartResult.length > 0) {
                chartResult.forEach(dbRow => {
                    const foundIndex = last10Days.findIndex(item => item.day_month === dbRow.day_month);
                    if (foundIndex !== -1) {
                        last10Days[foundIndex].revenue = dbRow.revenue; 
                    }
                });
            }

            res.render('reports/index', { 
                current: currentData,
                chartData: last10Days 
            });
        });
    });
});

module.exports = router;