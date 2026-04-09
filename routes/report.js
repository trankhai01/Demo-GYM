const express = require('express');
const router = express.Router();
// Đổi lại đường dẫn db.js cho khớp với file cấu hình Database trên máy bạn nhé!
const db = require('../config/db'); 

// Middleware kiểm tra quyền (Chỉ Admin mới được xem doanh thu)
function requireAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send("Bạn không có quyền truy cập trang này!");
    }
}

router.get('/revenue', requireAdmin, (req, res) => {
    // Câu SQL lấy tổng doanh thu theo từng tháng trong năm nay
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

        // Tạo mảng 12 tháng mặc định là 0 VNĐ
        let monthlyData = new Array(12).fill(0);

        // Lắp dữ liệu thật từ DB vào mảng
        results.forEach(row => {
            // Tháng 1 (month = 1) thì nằm ở vị trí index 0 trong mảng
            monthlyData[row.month - 1] = row.total_revenue;
        });

        // Trả dữ liệu sang view (biến thành chuỗi JSON để thẻ <script> đọc được)
        res.render('reports/revenue', { 
            chartData: JSON.stringify(monthlyData),
            currentYear: new Date().getFullYear()
        });
    });
});

module.exports = router;