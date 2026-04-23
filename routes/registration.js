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

    const finalizeInvoice = (invoiceId) => {
        if (cart_items && cart_items.length > 0) {
            const details = cart_items.map(item => [invoiceId, item.id, item.qty, item.price]);
            
            db.query(
                "INSERT INTO registration_details (registration_id, product_id, quantity, price) VALUES ?", 
                [details], 
                (err) => {
                    if (err) console.error("Lỗi lưu chi tiết đơn hàng (Nhưng vẫn cho qua):", err);
                    return res.json({ invoiceId: invoiceId });
                }
            );
        } else {
            return res.json({ invoiceId: invoiceId });
        }
    };

    if (package_id) {
        db.query("SELECT duration_months, pt_sessions FROM packages WHERE id = ?", [package_id], (err, pkg) => {
            if (err) return res.status(500).json({ error: "Lỗi truy vấn database gói tập" });

            let exp_date = reg_date;
            let totalPt = 0; 

            if (pkg.length > 0) {
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
                if (err) return res.status(500).json({ error: err.message });
                finalizeInvoice(result.insertId);
            });
        });
    } 
    else {
        const sql = `
            INSERT INTO registrations 
            (member_id, package_id, trainer_id, price, registration_date, expiration_date, schedule, payment_status, payment_method, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 'Tiền mặt', 'active')
        `;
        db.query(sql, [member_id || null, null, trainer_id || null, total_price, reg_date, reg_date, schedule], (err, result) => {
            if (err) {
                console.log("LỖI SQL BÁN LẺ:", err);
                return res.status(500).json({ error: err.message });
            }
            finalizeInvoice(result.insertId);
        });
    }
});

router.get('/checkout/:id', (req, res) => {
    const invoiceId = req.params.id;
    const sqlInvoice = `
        SELECT r.*, m.fullname AS member_name, p.package_name AS package_name 
        FROM registrations r
        LEFT JOIN members m ON r.member_id = m.id
        LEFT JOIN packages p ON r.package_id = p.id
        WHERE r.id = ?
    `;

    db.query(sqlInvoice, [invoiceId], (err, invoiceResult) => {
        if (err || invoiceResult.length === 0) {
            console.error("Lỗi tìm hóa đơn:", err);
            return res.status(404).send("Không tìm thấy hóa đơn!");
        }
        const invoice = invoiceResult[0];
        const sqlDetails = `
            SELECT rd.*, pr.product_name 
            FROM registration_details rd
            JOIN products pr ON rd.product_id = pr.id
            WHERE rd.registration_id = ?
        `;

        db.query(sqlDetails, [invoiceId], (err, detailsResult) => {
            if (err) {
                console.error("Lỗi lấy chi tiết sản phẩm:", err);
                return res.status(500).send("Lỗi lấy chi tiết sản phẩm");
            }
            res.render('registrations/checkout', {
                invoice: invoice,
                details: detailsResult
            });
        });
    });
});

router.post('/checkout/confirm/:id', (req, res) => {
    const registrationId = req.params.id;
    const { payment_method } = req.body;

    db.query("UPDATE registrations SET payment_status = 'Success', payment_method = ? WHERE id = ?", 
    [payment_method, registrationId], (err, result) => {
        if (err) return res.status(500).send("Lỗi cập nhật thanh toán");

        db.query("SELECT product_id, quantity FROM registration_details WHERE registration_id = ?", 
        [registrationId], (err, items) => {
            if (err) {
                console.error("Lỗi lấy chi tiết đơn hàng: ", err);
                return res.redirect('/reports'); 
            }

            items.forEach(item => {
                if (item.product_id) { 
                    db.query("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?", 
                    [item.quantity, item.product_id], (err) => {
                        if(err) console.error(`Lỗi trừ kho sản phẩm ${item.product_id}: `, err);
                    });
                }
            });

            res.redirect('/reports'); 
        });
    });
});



module.exports = router;