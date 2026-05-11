const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, (req, res) => {
    const revenueSql = `
        SELECT SUM(price) as total_revenue 
        FROM registrations 
        WHERE payment_status = 'Success' 
        AND MONTH(registration_date) = MONTH(CURRENT_DATE()) 
        AND YEAR(registration_date) = YEAR(CURRENT_DATE())
    `;
    const packageSql = `
        SELECT COUNT(id) as total_sold
        FROM registrations 
        WHERE package_id IS NOT NULL 
          AND payment_status = 'Success'
          AND MONTH(registration_date) = MONTH(CURRENT_DATE()) 
          AND YEAR(registration_date) = YEAR(CURRENT_DATE())
    `;
    const chartDataSql = `
        SELECT 
            DATE_FORMAT(registration_date, '%d/%m') as day_month,
            SUM(price) as revenue
        FROM registrations
        WHERE payment_status = 'Success'
        AND registration_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 9 DAY)
        GROUP BY DATE_FORMAT(registration_date, '%Y-%m-%d'), day_month
        ORDER BY DATE_FORMAT(registration_date, '%Y-%m-%d') ASC
    `;
    db.query(revenueSql, (err, revenueResult) => {
        if (err) return res.status(500).send("Lỗi tính doanh thu");
        
        db.query(packageSql, (err, packageResult) => {
            if (err) return res.status(500).send("Lỗi đếm gói tập");
            
            db.query(chartDataSql, (err, chartResult) => {
                if (err) return res.status(500).send("Lỗi biểu đồ");
                const totalRevenue = revenueResult[0].total_revenue || 0;
                const totalSold = packageResult[0].total_sold || 0;
                
                const currentData = { 
                    total_revenue: totalRevenue, 
                    total_sold: totalSold 
                };
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
});

module.exports = router;