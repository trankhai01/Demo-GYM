const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff } = require('../middleware/auth');

router.use(requireStaff);

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

// Route /add cũ (đăng ký gói đơn giản không qua POS) đã được loại bỏ:
// không có UI gọi tới, và sau khi đồng bộ payment_status='Pending' (PR #8)
// route này sẽ tạo hóa đơn 'Pending' không có đường vào checkout. Mọi
// đăng ký gói giờ đi qua /add-complex (POS) hoặc /members/view/:id/register
// (đều redirect sang /registrations/checkout/:id).

// Tạo hóa đơn POS có cả gói tập + sản phẩm. Bọc trong transaction để
router.post('/add-complex', (req, res) => {
    const { member_id, package_id, cart_items, total_price } = req.body;
    const reg_date = new Date().toISOString().split('T')[0];

    db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: "Không lấy được kết nối DB" });

        const fail = (msg, code) => {
            conn.rollback(() => {
                conn.release();
                res.status(500).json({ error: msg });
            });
            if (code) console.error(`[add-complex] ${code}:`, msg);
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).json({ error: "Lỗi mở transaction" });
            }

            const computeAndInsert = (durationMonths, totalPt) => {
                let exp_date = reg_date;
                if (durationMonths) {
                    const expDate = new Date();
                    expDate.setMonth(expDate.getMonth() + durationMonths);
                    exp_date = expDate.toISOString().split('T')[0];
                }

                const sql = `
                    INSERT INTO registrations
                    (member_id, package_id, price, registration_date, expiration_date, total_sessions, payment_status, payment_method, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Tiền mặt', 'active')
                `;
                const params = [
                    member_id || null,
                    package_id || null,
                    total_price,
                    reg_date,
                    exp_date,
                    totalPt
                ];

                conn.query(sql, params, (err, result) => {
                    if (err) return fail(err.message, 'INSERT registrations');
                    const invoiceId = result.insertId;

                    if (cart_items && cart_items.length > 0) {
                        const details = cart_items.map(item => [invoiceId, item.id, item.qty, item.price]);
                        conn.query(
                            "INSERT INTO registration_details (registration_id, product_id, quantity, price) VALUES ?",
                            [details],
                            (err) => {
                                if (err) return fail(err.message, 'INSERT registration_details');
                                conn.commit((err) => {
                                    if (err) return fail(err.message, 'COMMIT');
                                    conn.release();
                                    res.json({ invoiceId });
                                });
                            }
                        );
                    } else {
                        conn.commit((err) => {
                            if (err) return fail(err.message, 'COMMIT');
                            conn.release();
                            res.json({ invoiceId });
                        });
                    }
                });
            };

            if (package_id) {
                conn.query("SELECT duration_months, pt_sessions FROM packages WHERE id = ?", [package_id], (err, pkg) => {
                    if (err) return fail("Lỗi truy vấn database gói tập");
                    const durationMonths = pkg.length > 0 ? pkg[0].duration_months : 0;
                    const totalPt = pkg.length > 0 ? pkg[0].pt_sessions : 0;
                    computeAndInsert(durationMonths, totalPt);
                });
            } else {
                computeAndInsert(0, 0);
            }
        });
    });
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

// Xác nhận thanh toán: cập nhật trạng thái + trừ kho atomically trong transaction.
router.post('/checkout/confirm/:id', (req, res) => {
    const registrationId = req.params.id;
    const { payment_method } = req.body;

    db.getConnection((err, conn) => {
        if (err) return res.status(500).send("Không lấy được kết nối DB");

        const fail = (status, msg) => {
            conn.rollback(() => {
                conn.release();
                if (typeof msg === 'string') {
                    res.status(status).send(msg);
                } else {
                    res.status(status).send("Lỗi xử lý thanh toán");
                }
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).send("Lỗi mở transaction");
            }

            conn.query(
                "UPDATE registrations SET payment_status = 'Success', payment_method = ? WHERE id = ?",
                [payment_method, registrationId],
                (err) => {
                    if (err) return fail(500, "Lỗi cập nhật thanh toán");

                    conn.query(
                        "SELECT product_id, quantity FROM registration_details WHERE registration_id = ?",
                        [registrationId],
                        (err, items) => {
                            if (err) return fail(500, "Lỗi lấy chi tiết đơn hàng");

                            const productItems = (items || []).filter(i => i.product_id);
                            let i = 0;

                            const decrementNext = () => {
                                if (i >= productItems.length) {
                                    return conn.commit((err) => {
                                        if (err) return fail(500, "Lỗi commit");
                                        conn.release();
                                        res.redirect('/reports');
                                    });
                                }
                                const item = productItems[i++];
                                conn.query(
                                    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?",
                                    [item.quantity, item.product_id, item.quantity],
                                    (err, result) => {
                                        if (err) return fail(500, "Lỗi trừ kho");
                                        if (result.affectedRows === 0) {
                                            return fail(409, `Sản phẩm ID ${item.product_id} không đủ tồn kho`);
                                        }
                                        decrementNext();
                                    }
                                );
                            };

                            decrementNext();
                        }
                    );
                }
            );
        });
    });
});

module.exports = router;
