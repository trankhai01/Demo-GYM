const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff } = require('../middleware/auth');
const { applyDiscountTransactional } = require('./discount');
const { STATUS } = require('../lib/status');
const auditLog = require('../lib/auditLog');
const payosPayment = require('../lib/payosPayment');

router.use(requireStaff);

router.get('/', (req, res) => {
    db.query("SELECT id, fullname, phone FROM members ORDER BY id DESC", (err, members) => {
        db.query("SELECT * FROM packages", (err, packages) => {
            db.query("SELECT * FROM trainers", (err, trainers) => {
                db.query("SELECT * FROM products WHERE status = ? AND stock_quantity > 0", [STATUS.INVENTORY.ACTIVE], (err, products) => {
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

function appendNotice(url, notice) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}notice=${encodeURIComponent(notice)}`;
}

function safeInvoiceReturnTo(value) {
    const raw = String(value || '');
    if (raw === '/registrations' || raw === '/registrations/') return '/registrations';
    if (raw.startsWith('/registrations/invoices')) return raw;
    return '/registrations/invoices';
}

function normalizeCartItems(cartItems) {
    if (!Array.isArray(cartItems)) return [];

    const byProductId = new Map();
    for (const item of cartItems) {
        const productId = Number(item && item.id);
        const qty = Number(item && item.qty);
        if (!Number.isInteger(productId) || productId <= 0) {
            throw new Error('Sản phẩm trong giỏ hàng không hợp lệ.');
        }
        if (!Number.isInteger(qty) || qty <= 0) {
            throw new Error('Số lượng sản phẩm không hợp lệ.');
        }
        byProductId.set(productId, (byProductId.get(productId) || 0) + qty);
    }

    return Array.from(byProductId, ([productId, qty]) => ({ productId, qty }));
}

router.get('/invoices', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 12;
    const offset = (page - 1) * limit;
    const paymentStatus = Object.values(STATUS.PAYMENT).includes(req.query.status) ? req.query.status : '';
    const q = String(req.query.q || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();

    const where = [];
    const params = [];

    if (paymentStatus) {
        where.push('r.payment_status = ?');
        params.push(paymentStatus);
    }
    if (from) {
        where.push('r.registration_date >= ?');
        params.push(from);
    }
    if (to) {
        where.push('r.registration_date <= ?');
        params.push(to);
    }
    if (q) {
        where.push('(CAST(r.id AS CHAR) LIKE ? OR m.fullname LIKE ? OR m.phone LIKE ? OR p.package_name LIKE ?)');
        const like = `%${q}%`;
        params.push(like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countSql = `
        SELECT COUNT(DISTINCT r.id) AS total
        FROM registrations r
        LEFT JOIN members m ON m.id = r.member_id
        LEFT JOIN packages p ON p.id = r.package_id
        ${whereSql}
    `;
    const dataSql = `
        SELECT r.id, r.registration_date, r.expiration_date, r.price, r.discount_amount,
               r.payment_status, r.payment_method, r.package_id,
               m.fullname AS member_name, m.phone AS member_phone,
               p.package_name,
               COALESCE(SUM(rd.quantity), 0) AS product_qty,
               COUNT(rd.id) AS detail_count
        FROM registrations r
        LEFT JOIN members m ON m.id = r.member_id
        LEFT JOIN packages p ON p.id = r.package_id
        LEFT JOIN registration_details rd ON rd.registration_id = r.id
        ${whereSql}
        GROUP BY r.id, r.registration_date, r.expiration_date, r.price, r.discount_amount,
                 r.payment_status, r.payment_method, r.package_id, m.fullname, m.phone, p.package_name
        ORDER BY r.id DESC
        LIMIT ? OFFSET ?
    `;

    db.query(countSql, params, (err, countRows) => {
        if (err) {
            console.error('[registrations/invoices] count:', err.message);
            return res.status(500).render('error', { message: 'Lỗi tải danh sách hóa đơn.' });
        }

        db.query(dataSql, [...params, limit, offset], (err2, rows) => {
            if (err2) {
                console.error('[registrations/invoices] data:', err2.message);
                return res.status(500).render('error', { message: 'Lỗi tải danh sách hóa đơn.' });
            }

            const totalRecords = Number(countRows[0]?.total) || 0;
            res.render('registrations/invoices', {
                invoices: rows || [],
                filters: { status: paymentStatus, q, from, to },
                currentPage: page,
                totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
                totalRecords,
                returnTo: req.originalUrl
            });
        });
    });
});

// Tạo hóa đơn POS.
router.post('/add-complex', (req, res) => {
    const { member_id, package_id, cart_items, discount_code } = req.body;
    const reg_date = new Date().toISOString().split('T')[0];
    const memberId = member_id ? Number(member_id) : null;
    const packageId = package_id ? Number(package_id) : null;
    let cartItems;

    try {
        cartItems = normalizeCartItems(cart_items);
    } catch (parseErr) {
        return res.status(400).json({ error: parseErr.message });
    }

    if (member_id && (!Number.isInteger(memberId) || memberId <= 0)) {
        return res.status(400).json({ error: 'Hội viên không hợp lệ.' });
    }
    if (package_id && (!Number.isInteger(packageId) || packageId <= 0)) {
        return res.status(400).json({ error: 'Gói tập không hợp lệ.' });
    }
    if (!packageId && cartItems.length === 0) {
        return res.status(400).json({ error: 'Hóa đơn đang trống.' });
    }

    db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ error: "Không lấy được kết nối DB" });

        const fail = (msg, code, status = 500) => {
            conn.rollback(() => {
                conn.release();
                res.status(status).json({ error: msg });
            });
            if (code) console.error(`[add-complex] ${code}:`, msg);
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).json({ error: "Lỗi mở transaction" });
            }

            const loadProducts = (callback) => {
                if (cartItems.length === 0) return callback(null, 0, []);

                const ids = cartItems.map(item => item.productId);
                conn.query(
                    "SELECT id, product_name, price, stock_quantity, status FROM products WHERE id IN (?) FOR UPDATE",
                    [ids],
                    (err, productRows) => {
                        if (err) return callback(err);

                        const productsById = new Map((productRows || []).map(product => [Number(product.id), product]));
                        let retailTotal = 0;
                        const details = [];

                        for (const item of cartItems) {
                            const product = productsById.get(item.productId);
                            if (!product || product.status !== STATUS.INVENTORY.ACTIVE) {
                                return callback(new Error(`Sản phẩm ID ${item.productId} không còn được bán.`));
                            }

                            const stock = Number(product.stock_quantity) || 0;
                            if (stock < item.qty) {
                                return callback(new Error(`Sản phẩm "${product.product_name}" chỉ còn ${stock} trong kho.`));
                            }

                            const price = Number(product.price) || 0;
                            retailTotal += price * item.qty;
                            details.push([item.productId, item.qty, price]);
                        }

                        callback(null, retailTotal, details);
                    }
                );
            };

            const computeAndInsert = (packageInfo) => {
                const durationMonths = Number(packageInfo.duration_months) || 0;
                const totalPt = Number(packageInfo.pt_sessions) || 0;
                const packagePrice = Number(packageInfo.price) || 0;
                let exp_date = reg_date;
                if (durationMonths) {
                    const expDate = new Date();
                    expDate.setMonth(expDate.getMonth() + durationMonths);
                    exp_date = expDate.toISOString().split('T')[0];
                }

                loadProducts((err, retailTotal, details) => {
                    if (err) return fail(err.message, 'product_validation', 409);

                    const baseTotal = packagePrice + retailTotal;
                    applyDiscountTransactional(conn, discount_code, baseTotal, memberId, (dErr, dRes) => {
                        if (dErr) return fail(dErr.message, 'discount', 400);
                        const finalPrice = dRes.final_amount;

                        const sql = `
                            INSERT INTO registrations
                            (member_id, package_id, price, discount_code_id, discount_amount, registration_date, expiration_date, total_sessions, payment_status, payment_method, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Tiền mặt', ?)
                        `;
                        const params = [
                            memberId,
                            packageId,
                            finalPrice,
                            dRes.discount_id,
                            dRes.discount_amount,
                            reg_date,
                            exp_date,
                            totalPt,
                            STATUS.PAYMENT.PENDING,
                            STATUS.REGISTRATION.ACTIVE
                        ];

                        conn.query(sql, params, (err, result) => {
                            if (err) return fail(err.message, 'INSERT registrations');
                            const invoiceId = result.insertId;

                            if (details.length > 0) {
                                const detailRows = details.map(([productId, qty, price]) => [invoiceId, productId, qty, price]);
                                return conn.query(
                                    "INSERT INTO registration_details (registration_id, product_id, quantity, price) VALUES ?",
                                    [detailRows],
                                    (err) => {
                                        if (err) return fail(err.message, 'INSERT registration_details');
                                        conn.commit((err) => {
                                            if (err) return fail(err.message, 'COMMIT');
                                            conn.release();
                                            res.json({
                                                invoiceId,
                                                discount_amount: dRes.discount_amount,
                                                final_price: finalPrice,
                                                base_price: baseTotal
                                            });
                                        });
                                    }
                                );
                            }

                            conn.commit((err) => {
                                if (err) return fail(err.message, 'COMMIT');
                                conn.release();
                                res.json({
                                    invoiceId,
                                    discount_amount: dRes.discount_amount,
                                    final_price: finalPrice,
                                    base_price: baseTotal
                                });
                            });
                        });
                    });
                });
            };

            if (packageId) {
                if (!memberId) {
                    return fail("Vui lòng chọn hội viên khi đăng ký gói tập.", 'missing_member', 400);
                }

                conn.query(
                    `SELECT r.id, r.payment_status, r.expiration_date, p.package_name
                     FROM registrations r
                     LEFT JOIN packages p ON p.id = r.package_id
                     WHERE r.member_id = ?
                       AND r.status = ?
                       AND r.payment_status IN (?, ?)
                       AND (r.expiration_date IS NULL OR r.expiration_date >= CURRENT_DATE())
                     ORDER BY r.expiration_date DESC, r.id DESC
                     LIMIT 1
                     FOR UPDATE`,
                    [memberId, STATUS.REGISTRATION.ACTIVE, STATUS.PAYMENT.SUCCESS, STATUS.PAYMENT.PENDING],
                    (err, activeRows) => {
                        if (err) return fail("Lỗi kiểm tra gói tập hiện tại", 'active_package_check');
                        if (activeRows && activeRows.length > 0) {
                            const active = activeRows[0];
                            const pkgName = active.package_name || 'gói tập hiện tại';
                            const exp = active.expiration_date
                                ? new Date(active.expiration_date).toLocaleDateString('vi-VN')
                                : 'không giới hạn';
                            return fail(
                                `Hội viên đang ở trong gói tập "${pkgName}" (hết hạn: ${exp}) nên không thể đăng ký gói tập khác.`,
                                'active_package_exists',
                                409
                            );
                        }

                        conn.query(
                            "SELECT duration_months, pt_sessions, price FROM packages WHERE id = ? FOR UPDATE",
                            [packageId],
                            (err, pkg) => {
                                if (err) return fail("Lỗi truy vấn database gói tập", 'package_query');
                                if (!pkg || pkg.length === 0) return fail("Gói tập không tồn tại.", 'package_not_found', 404);
                                computeAndInsert(pkg[0]);
                            }
                        );
                    }
                );
            } else {
                computeAndInsert({ duration_months: 0, pt_sessions: 0, price: 0 });
            }
        });
    });
});

router.get('/checkout/:id', (req, res) => {
    const invoiceId = req.params.id;
    const sqlInvoice = `
        SELECT r.*, m.fullname AS member_name, m.phone AS member_phone, p.package_name AS package_name
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
            const render = (payment, paymentError) => {
                res.render('registrations/checkout', {
                    invoice,
                    details: detailsResult,
                    payosPayment: payment,
                    payosConfigured: payosPayment.isConfigured(),
                    payosCreateError: paymentError
                });
            };

            if (invoice.payment_status === STATUS.PAYMENT.SUCCESS) return render(null, null);

            payosPayment.syncPayment(invoice.id, (syncErr, syncResult) => {
                if (syncErr) console.error('[registrations/checkout payos sync]', syncErr.message);
                if (syncResult && syncResult.paid) {
                    invoice.payment_status = STATUS.PAYMENT.SUCCESS;
                    invoice.payment_method = 'payOS';
                    return render(syncResult.payment, null);
                }

                payosPayment.createPayment(invoice, req, (paymentErr, payment) => {
                    if (paymentErr) {
                        console.error('[registrations/checkout payos]', paymentErr.message);
                        return render(syncResult && syncResult.payment ? syncResult.payment : null, paymentErr);
                    }
                    render(payment, null);
                }, {
                    returnPath: `/registrations/checkout/${invoice.id}`,
                    cancelPath: `/registrations/checkout/${invoice.id}?notice=payos_cancelled`
                });
            });
        });
    });
});

router.get('/checkout/status/:id', (req, res) => {
    const invoiceId = Number(req.params.id);
    db.query(
        'SELECT id, payment_status FROM registrations WHERE id = ? LIMIT 1',
        [invoiceId],
        (err, rows) => {
            if (err || !rows || rows.length === 0) return res.status(404).json({ ok: false });
            if (rows[0].payment_status === STATUS.PAYMENT.SUCCESS) {
                return res.json({ ok: true, payment_status: STATUS.PAYMENT.SUCCESS });
            }

            payosPayment.syncPayment(invoiceId, (syncErr, syncResult) => {
                if (syncErr) console.error('[registrations/status payos sync]', syncErr.message);
                res.json({
                    ok: true,
                    payment_status: syncResult && syncResult.paid ? STATUS.PAYMENT.SUCCESS : rows[0].payment_status
                });
            });
        }
    );
});

// Hủy hóa đơn chờ thanh toán.
router.post('/checkout/cancel/:id', (req, res) => {
    const registrationId = req.params.id;
    const returnTo = safeInvoiceReturnTo(req.body.return_to);

    db.getConnection((err, conn) => {
        if (err) return res.status(500).render('error', { message: 'Không lấy được kết nối DB' });

        const fail = (redirectPath, msg, sqlErr) => {
            if (sqlErr) console.error('[checkout/cancel]', sqlErr.message);
            else if (msg) console.error('[checkout/cancel]', msg);
            conn.rollback(() => {
                conn.release();
                res.redirect(redirectPath);
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.redirect(appendNotice(returnTo, 'cancel_error'));
            }

            conn.query(
                "SELECT id, payment_status, discount_code_id FROM registrations WHERE id = ? FOR UPDATE",
                [registrationId],
                (err, rows) => {
                    if (err) return fail(appendNotice(returnTo, 'cancel_error'), null, err);
                    if (!rows || rows.length === 0) return fail(appendNotice(returnTo, 'cancel_not_found'), 'Không tìm thấy hóa đơn');

                    const invoice = rows[0];
                    if (invoice.payment_status !== STATUS.PAYMENT.PENDING) {
                        return fail(appendNotice(returnTo, 'cancel_paid'), 'Không thể hủy hóa đơn đã thanh toán');
                    }

                    const releaseDiscount = (cb) => {
                        if (!invoice.discount_code_id) return cb();
                        conn.query(
                            "UPDATE discount_codes SET used_count = GREATEST(used_count - 1, 0) WHERE id = ?",
                            [invoice.discount_code_id],
                            cb
                        );
                    };

                    releaseDiscount((errDisc) => {
                        if (errDisc) return fail(appendNotice(returnTo, 'cancel_error'), null, errDisc);

                        conn.query("DELETE FROM registration_details WHERE registration_id = ?", [registrationId], (errDetails) => {
                            if (errDetails) return fail(appendNotice(returnTo, 'cancel_error'), null, errDetails);

                            conn.query(
                                "DELETE FROM registrations WHERE id = ? AND payment_status = ?",
                                [registrationId, STATUS.PAYMENT.PENDING],
                                (errDel, result) => {
                                    if (errDel) return fail(appendNotice(returnTo, 'cancel_error'), null, errDel);
                                    if (result.affectedRows === 0) {
                                        return fail(appendNotice(returnTo, 'cancel_paid'), 'Hóa đơn không còn ở trạng thái chờ thanh toán');
                                    }

                                    conn.commit((errCommit) => {
                                        if (errCommit) return fail(appendNotice(returnTo, 'cancel_error'), null, errCommit);
                                        conn.release();
                                        auditLog.record(req, 'invoice.cancel', 'registration', registrationId, {
                                            discount_code_id: invoice.discount_code_id || null
                                        });
                                        res.redirect(appendNotice(returnTo, 'cancel_success'));
                                    });
                                }
                            );
                        });
                    });
                }
            );
        });
    });
});

// Xác nhận thanh toán và trừ kho.
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
                "SELECT id, payment_status FROM registrations WHERE id = ? FOR UPDATE",
                [registrationId],
                (err, invoiceRows) => {
                    if (err) return fail(500, "Lỗi kiểm tra hóa đơn");
                    if (!invoiceRows || invoiceRows.length === 0) return fail(404, "Không tìm thấy hóa đơn");
                    if (invoiceRows[0].payment_status === STATUS.PAYMENT.SUCCESS) {
                        return fail(409, "Hóa đơn này đã được xác nhận thanh toán trước đó");
                    }
                    conn.query(
                        "UPDATE registrations SET payment_status = ?, payment_method = ? WHERE id = ? AND payment_status = ?",
                        [STATUS.PAYMENT.SUCCESS, payment_method, registrationId, STATUS.PAYMENT.PENDING],
                        (err, updateResult) => {
                            if (err) return fail(500, "Lỗi cập nhật thanh toán");
                            if (updateResult.affectedRows === 0) return fail(409, "Hóa đơn không còn ở trạng thái chờ thanh toán");

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
                                                auditLog.record(req, 'invoice.confirm_payment', 'registration', registrationId, {
                                                    payment_method,
                                                    product_count: productItems.length
                                                });
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
                }
            );
        });
    });
});

module.exports = router;
