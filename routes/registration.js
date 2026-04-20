const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    db.query("SELECT id, fullname, phone FROM members ORDER BY id DESC", (err, members) => {
        db.query("SELECT * FROM packages", (err, packages) => {
            db.query("SELECT * FROM trainers", (err, trainers) => {
                db.query("SELECT * FROM products WHERE status = 'Active' AND stock_quantity > 0", (err, products) => {
                    res.render('registrations/index', { 
                        members: members || [], 
                        packages: packages || [], 
                        trainers: trainers || [],
                        products: products || [] 
                    });
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

router.post('/add-complex', (req, res) => {
    const { member_id, package_id, trainer_id, schedule, cart_items, total_price } = req.body;
    const reg_date = new Date().toISOString().split('T')[0];

    let exp_date = reg_date;

    if (package_id) {
        db.query("SELECT duration_months, pt_sessions FROM packages WHERE id = ?", [package_id], (err, pkg) => {
            let exp_date = reg_date;
            let totalPt = 0; 

            if (!err && pkg.length > 0) {
                let expDate = new Date();
                expDate.setMonth(expDate.getMonth() + pkg[0].duration_months);
                exp_date = expDate.toISOString().split('T')[0];
                totalPt = pkg[0].pt_sessions; 
            }

            const sql = `
                INSERT INTO registrations 
                (member_id, package_id, trainer_id, price, registration_date, expiration_date, schedule, total_sessions, payment_status, payment_method, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Tiền mặt', 'active')
            `;
            
            db.query(sql, [member_id, package_id, trainer_id || null, total_price, reg_date, exp_date, schedule, totalPt], (err, result) => {
                if (err) return res.status(500).json({ error: "Lỗi tạo hóa đơn" });
                
                if (cart_items && cart_items.length > 0) {
                    cart_items.forEach(item => {
                        db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [item.qty, item.id]);
                    });
                }
                res.json({ invoiceId: result.insertId });
            });
        });
    } else {
        insertInvoice();
    }

    function insertInvoice() {
        const sql = `
            INSERT INTO registrations (member_id, package_id, trainer_id, price, registration_date, expiration_date, schedule, payment_status, payment_method, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'Tiền mặt', 'active')
        `;
        db.query(sql, [member_id, package_id, trainer_id, total_price, reg_date, exp_date, schedule], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Lỗi tạo hóa đơn" });
            }

            if (cart_items && cart_items.length > 0) {
                cart_items.forEach(item => {
                    db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", [item.qty, item.id]);
                });
            }
            res.json({ invoiceId: result.insertId });
        });
    }
});

router.get('/checkout/:id', (req, res) => {
    const sql = `
        SELECT r.*, m.fullname, m.phone, p.package_name 
        FROM registrations r
        JOIN members m ON r.member_id = m.id
        LEFT JOIN packages p ON r.package_id = p.id
        WHERE r.id = ?
    `;
    db.query(sql, [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/registrations');
        res.render('registrations/checkout', { invoice: result[0] });
    });
});

router.post('/checkout/confirm/:id', (req, res) => {
    const { payment_method } = req.body;
    db.query("UPDATE registrations SET payment_status = 'Success', payment_method = ? WHERE id = ?", 
    [payment_method, req.params.id], (err, result) => {
        if (err) return res.status(500).send("Lỗi cập nhật thanh toán");
        res.redirect('/reports'); 
    });
});

module.exports = router;