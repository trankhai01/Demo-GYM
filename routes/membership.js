const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireMember } = require('../middleware/auth');
const { STATUS } = require('../lib/status');
const systemSettings = require('../lib/systemSettings');
const payosPayment = require('../lib/payosPayment');
const auditLog = require('../lib/auditLog');
const registrationUpgrade = require('../lib/registrationUpgrade');
const { computeDiscount } = require('./discount');

router.use(requireMember);

function invoiceForMemberSql() {
    return `
        SELECT r.*, m.fullname AS member_name, m.phone AS member_phone,
               p.package_name, p.duration_months, p.pt_sessions, p.price AS package_price,
               oldp.package_name AS upgrade_from_package_name
        FROM registrations r
        JOIN members m ON m.id = r.member_id
        JOIN packages p ON p.id = r.package_id
        LEFT JOIN registrations oldr ON oldr.id = r.upgrade_from_registration_id
        LEFT JOIN packages oldp ON oldp.id = oldr.package_id
        WHERE r.id = ? AND r.member_id = ?
        LIMIT 1
    `;
}

function renderCheckout(req, res, invoice, details = {}) {
    systemSettings.load((err, settings) => {
        if (err) console.error('[membership/checkout settings]', err.message);

        const render = (payment, paymentError) => {
            res.render('membership/checkout', {
                invoice,
                settings,
                payosPayment: payment,
                payosConfigured: payosPayment.isConfigured(),
                payosCreateError: paymentError,
                notice: req.query.notice || null,
                ...details
            });
        };

        if (invoice.payment_status === STATUS.PAYMENT.SUCCESS) {
            return render(null, null);
        }

        payosPayment.syncPayment(invoice.id, (syncErr, syncResult) => {
            if (syncErr) {
                console.error('[membership/checkout payos sync]', syncErr.message);
            }

            if (syncResult && syncResult.paid) {
                invoice.payment_status = STATUS.PAYMENT.SUCCESS;
                invoice.payment_method = 'payOS';
                return render(syncResult.payment, null);
            }

            payosPayment.createPayment(invoice, req, (paymentErr, payment) => {
                if (paymentErr) {
                    console.error('[membership/checkout payos]', paymentErr.message);
                    return render(syncResult && syncResult.payment ? syncResult.payment : null, paymentErr);
                }
                render(payment, null);
            });
        });
    });
}

router.post('/register/:packageId', (req, res) => {
    const memberId = req.session.user.id;
    const packageId = Number(req.params.packageId);
    const today = new Date().toISOString().slice(0, 10);

    if (!Number.isInteger(packageId) || packageId <= 0) {
        return res.status(400).render('error', { message: 'Gói tập không hợp lệ.' });
    }

    registrationUpgrade.ensure((ensureErr) => {
        if (ensureErr) return res.status(500).render('error', { message: 'Lỗi chuẩn bị dữ liệu nâng cấp gói.' });

        db.getConnection((err, conn) => {
            if (err) return res.status(500).render('error', { message: 'Không lấy được kết nối DB.' });

            const fail = (status, message, sqlErr) => {
                if (sqlErr) console.error('[membership/register]', sqlErr.message);
                conn.rollback(() => {
                    conn.release();
                    res.status(status).render('error', { message });
                });
            };

            conn.beginTransaction((err) => {
                if (err) {
                    conn.release();
                    return res.status(500).render('error', { message: 'Lỗi mở giao dịch đăng ký.' });
                }

                conn.query(
                    `SELECT r.id, r.package_id, r.price, r.registration_date, r.expiration_date,
                            r.total_sessions, r.used_sessions, r.payment_status,
                            r.upgrade_from_registration_id, r.upgrade_credit_amount,
                            p.package_name, p.duration_months, p.price AS package_price, p.pt_sessions
                     FROM registrations r
                     JOIN packages p ON p.id = r.package_id
                     WHERE r.member_id = ?
                       AND r.status = ?
                       AND r.package_id IS NOT NULL
                       AND r.payment_status IN (?, ?)
                       AND (r.expiration_date IS NULL OR r.expiration_date >= CURRENT_DATE())
                     ORDER BY r.id DESC
                     LIMIT 1
                     FOR UPDATE`,
                    [memberId, STATUS.REGISTRATION.ACTIVE, STATUS.PAYMENT.PENDING, STATUS.PAYMENT.SUCCESS],
                    (err, activeRows) => {
                        if (err) return fail(500, 'Lỗi kiểm tra gói tập hiện tại.', err);

                        const active = activeRows && activeRows[0];
                        if (active && active.payment_status === STATUS.PAYMENT.PENDING) {
                            conn.rollback(() => {
                                conn.release();
                                return res.redirect(`/membership/checkout/${active.id}?notice=existing_pending`);
                            });
                            return;
                        }

                        if (active && active.payment_status === STATUS.PAYMENT.SUCCESS) {
                            return createUpgradeInvoice(conn, req, res, memberId, packageId, active, fail);
                        }

                        createNewInvoice(conn, req, res, memberId, packageId, today, fail);
                    }
                );
            });
        });
    });
});

function createNewInvoice(conn, req, res, memberId, packageId, today, fail) {
    conn.query(
        'SELECT id, package_name, duration_months, price, pt_sessions FROM packages WHERE id = ? FOR UPDATE',
        [packageId],
        (err, packageRows) => {
            if (err) return fail(500, 'Lỗi tải thông tin gói tập.', err);
            if (!packageRows || packageRows.length === 0) return fail(404, 'Không tìm thấy gói tập.');

            const pkg = packageRows[0];
            const expDate = new Date();
            expDate.setMonth(expDate.getMonth() + Number(pkg.duration_months || 0));
            const expirationDate = expDate.toISOString().slice(0, 10);

            conn.query(
                `INSERT INTO registrations
                 (member_id, package_id, price, registration_date, expiration_date, total_sessions,
                  payment_status, payment_method, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    memberId,
                    packageId,
                    Number(pkg.price) || 0,
                    today,
                    expirationDate,
                    Number(pkg.pt_sessions) || 0,
                    STATUS.PAYMENT.PENDING,
                    'payOS',
                    STATUS.REGISTRATION.ACTIVE
                ],
                (err, result) => {
                    if (err) return fail(500, 'Lỗi tạo hóa đơn gói tập.', err);
                    const invoiceId = result.insertId;

                    conn.commit((err) => {
                        if (err) return fail(500, 'Lỗi lưu hóa đơn.', err);
                        conn.release();
                        auditLog.record(req, 'membership.self_register', 'registration', invoiceId, {
                            package_id: packageId
                        });
                        res.redirect(`/membership/checkout/${invoiceId}`);
                    });
                }
            );
        }
    );
}

function createUpgradeInvoice(conn, req, res, memberId, packageId, activePackage, fail) {
    conn.query(
        'SELECT id, package_name, duration_months, price, pt_sessions FROM packages WHERE id = ? FOR UPDATE',
        [packageId],
        (err, packageRows) => {
            if (err) return fail(500, 'Lỗi tải thông tin gói tập.', err);
            if (!packageRows || packageRows.length === 0) return fail(404, 'Không tìm thấy gói tập.');

            const targetPackage = packageRows[0];
            let upgrade;
            try {
                upgrade = registrationUpgrade.calculateUpgrade(activePackage, targetPackage);
            } catch (calcErr) {
                return fail(409, calcErr.message);
            }

            conn.query(
                `INSERT INTO registrations
                 (member_id, package_id, price, registration_date, expiration_date,
                  total_sessions, used_sessions, payment_status, payment_method, status,
                  upgrade_from_registration_id, upgrade_credit_amount, upgrade_total_days, upgrade_days_remaining)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    memberId,
                    packageId,
                    upgrade.amountDue,
                    upgrade.registrationDate,
                    upgrade.expirationDate,
                    upgrade.totalSessions,
                    upgrade.usedSessions,
                    STATUS.PAYMENT.PENDING,
                    'payOS',
                    STATUS.REGISTRATION.ACTIVE,
                    activePackage.id,
                    upgrade.creditAmount,
                    upgrade.totalDays,
                    upgrade.daysRemaining
                ],
                (err, result) => {
                    if (err) return fail(500, 'Lỗi tạo hóa đơn nâng cấp gói tập.', err);
                    const invoiceId = result.insertId;

                    conn.commit((err) => {
                        if (err) return fail(500, 'Lỗi lưu hóa đơn nâng cấp.', err);
                        conn.release();
                        auditLog.record(req, 'membership.upgrade_register', 'registration', invoiceId, {
                            from_registration_id: activePackage.id,
                            from_package_id: activePackage.package_id,
                            to_package_id: packageId,
                            credit_amount: upgrade.creditAmount,
                            amount_due: upgrade.amountDue
                        });
                        res.redirect(`/membership/checkout/${invoiceId}`);
                    });
                }
            );
        }
    );
}

router.get('/checkout/:id', (req, res) => {
    const invoiceId = Number(req.params.id);
    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
        return res.status(404).render('error', { message: 'Không tìm thấy hóa đơn.' });
    }

    db.query(invoiceForMemberSql(), [invoiceId, req.session.user.id], (err, rows) => {
        if (err) {
            console.error('[membership/checkout]', err.message);
            return res.status(500).render('error', { message: 'Lỗi tải hóa đơn.' });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).render('error', { message: 'Không tìm thấy hóa đơn.' });
        }
        renderCheckout(req, res, rows[0]);
    });
});

router.get('/checkout/status/:id', (req, res) => {
    const invoiceId = Number(req.params.id);
    db.query(
        'SELECT id, payment_status FROM registrations WHERE id = ? AND member_id = ? LIMIT 1',
        [invoiceId, req.session.user.id],
        (err, rows) => {
            if (err || !rows || rows.length === 0) return res.status(404).json({ ok: false });
            if (rows[0].payment_status === STATUS.PAYMENT.SUCCESS) {
                return res.json({ ok: true, payment_status: STATUS.PAYMENT.SUCCESS });
            }

            payosPayment.syncPayment(invoiceId, (syncErr, syncResult) => {
                if (syncErr) console.error('[membership/status payos sync]', syncErr.message);
                res.json({
                    ok: true,
                    payment_status: syncResult && syncResult.paid ? STATUS.PAYMENT.SUCCESS : rows[0].payment_status
                });
            });
        }
    );
});

router.post('/checkout/cancel/:id', (req, res) => {
    const invoiceId = Number(req.params.id);
    const memberId = req.session.user.id;

    db.getConnection((err, conn) => {
        if (err) return res.status(500).render('error', { message: 'Không lấy được kết nối DB.' });

        const fail = (status, message, sqlErr) => {
            if (sqlErr) console.error('[membership/cancel]', sqlErr.message);
            conn.rollback(() => {
                conn.release();
                res.status(status).render('error', { message });
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).render('error', { message: 'Lỗi mở giao dịch hủy đơn.' });
            }

            conn.query(
                'SELECT id, payment_status FROM registrations WHERE id = ? AND member_id = ? FOR UPDATE',
                [invoiceId, memberId],
                (err, rows) => {
                    if (err) return fail(500, 'Lỗi kiểm tra hóa đơn.', err);
                    if (!rows || rows.length === 0) return fail(404, 'Không tìm thấy hóa đơn.');
                    if (rows[0].payment_status !== STATUS.PAYMENT.PENDING) {
                        return fail(409, 'Không thể hủy hóa đơn đã thanh toán.');
                    }

                    conn.query('DELETE FROM registrations WHERE id = ? AND member_id = ?', [invoiceId, memberId], (err) => {
                        if (err) return fail(500, 'Lỗi hủy hóa đơn.', err);
                        conn.commit((err) => {
                            if (err) return fail(500, 'Lỗi lưu thao tác hủy.', err);
                            conn.release();
                            auditLog.record(req, 'membership.cancel_checkout', 'registration', invoiceId);
                            res.redirect('/?notice=membership_cancelled#packages');
                        });
                    });
                }
            );
        });
    });
});

router.post('/checkout/:id/apply-discount', (req, res) => {
    const invoiceId = Number(req.params.id);
    const memberId = req.session.user.id;
    const discountCode = String(req.body.code || '').trim().toUpperCase();

    if (!discountCode) {
        return res.json({ ok: false, error: 'Vui lòng nhập mã ưu đãi.' });
    }

    db.getConnection((err, conn) => {
        if (err) return res.json({ ok: false, error: 'Lỗi kết nối database.' });

        const fail = (msg) => {
            conn.rollback(() => {
                conn.release();
                res.json({ ok: false, error: msg });
            });
        };

        conn.beginTransaction((txErr) => {
            if (txErr) {
                conn.release();
                return res.json({ ok: false, error: 'Lỗi giao dịch.' });
            }

            conn.query(
                `SELECT r.id, r.price, r.discount_code_id, r.discount_amount, r.payment_status
                 FROM registrations r
                 WHERE r.id = ? AND r.member_id = ? FOR UPDATE`,
                [invoiceId, memberId],
                (regErr, regRows) => {
                    if (regErr) return fail('Lỗi tải hóa đơn.');
                    if (!regRows || regRows.length === 0) return fail('Không tìm thấy hóa đơn.');

                    const invoice = regRows[0];
                    if (invoice.payment_status !== STATUS.PAYMENT.PENDING) {
                        return fail('Hóa đơn đã được thanh toán, không thể áp dụng mã.');
                    }

                    conn.query(
                        'SELECT * FROM discount_codes WHERE code = ? FOR UPDATE',
                        [discountCode],
                        (dcErr, dcRows) => {
                            if (dcErr) return fail('Lỗi kiểm tra mã ưu đãi.');
                            if (!dcRows || dcRows.length === 0) return fail('Mã ưu đãi không tồn tại.');

                            const dc = dcRows[0];
                            const basePrice = Number(invoice.price) + Number(invoice.discount_amount);
                            
                            const result = computeDiscount(dc, basePrice, memberId);
                            if (!result.ok) return fail(result.error);

                            const discountAmount = result.discount_amount;
                            const finalPrice = Math.max(0, basePrice - discountAmount);

                            const releaseOldDiscount = (cb) => {
                                if (!invoice.discount_code_id) return cb();
                                conn.query(
                                    "UPDATE discount_codes SET used_count = GREATEST(used_count - 1, 0) WHERE id = ?",
                                    [invoice.discount_code_id],
                                    cb
                                );
                            };

                            releaseOldDiscount((errOld) => {
                                if (errOld) return fail('Lỗi giải phóng mã ưu đãi cũ.');

                                conn.query(
                                    "UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?",
                                    [dc.id],
                                    (errNew) => {
                                        if (errNew) return fail('Lỗi áp dụng mã ưu đãi mới.');

                                        conn.query(
                                            `UPDATE registrations
                                             SET price = ?, discount_code_id = ?, discount_amount = ?
                                             WHERE id = ?`,
                                            [finalPrice, dc.id, discountAmount, invoiceId],
                                            (errUpdateReg) => {
                                                if (errUpdateReg) return fail('Lỗi cập nhật hóa đơn.');

                                                conn.query(
                                                    "DELETE FROM payos_payments WHERE registration_id = ?",
                                                    [invoiceId],
                                                    (errDeletePayOS) => {
                                                        if (errDeletePayOS) return fail('Lỗi cập nhật thông tin thanh toán.');

                                                        conn.commit((commitErr) => {
                                                            if (commitErr) return fail('Lỗi lưu thay đổi.');
                                                            conn.release();
                                                            res.json({
                                                                ok: true,
                                                                message: 'Áp dụng mã ưu đãi thành công!',
                                                                discount_amount: discountAmount,
                                                                final_price: finalPrice
                                                            });
                                                        });
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            });
                        }
                    );
                }
            );
        });
    });
});

router.post('/checkout/:id/remove-discount', (req, res) => {
    const invoiceId = Number(req.params.id);
    const memberId = req.session.user.id;

    db.getConnection((err, conn) => {
        if (err) return res.json({ ok: false, error: 'Lỗi kết nối database.' });

        const fail = (msg) => {
            conn.rollback(() => {
                conn.release();
                res.json({ ok: false, error: msg });
            });
        };

        conn.beginTransaction((txErr) => {
            if (txErr) {
                conn.release();
                return res.json({ ok: false, error: 'Lỗi giao dịch.' });
            }

            conn.query(
                `SELECT r.id, r.price, r.discount_code_id, r.discount_amount, r.payment_status
                 FROM registrations r
                 WHERE r.id = ? AND r.member_id = ? FOR UPDATE`,
                [invoiceId, memberId],
                (regErr, regRows) => {
                    if (regErr) return fail('Lỗi tải hóa đơn.');
                    if (!regRows || regRows.length === 0) return fail('Không tìm thấy hóa đơn.');

                    const invoice = regRows[0];
                    if (invoice.payment_status !== STATUS.PAYMENT.PENDING) {
                        return fail('Hóa đơn đã được thanh toán, không thể hủy mã.');
                    }
                    if (!invoice.discount_code_id) {
                        return fail('Hóa đơn chưa áp dụng mã ưu đãi.');
                    }

                    const basePrice = Number(invoice.price) + Number(invoice.discount_amount);

                    conn.query(
                        "UPDATE discount_codes SET used_count = GREATEST(used_count - 1, 0) WHERE id = ?",
                        [invoice.discount_code_id],
                        (errOld) => {
                            if (errOld) return fail('Lỗi giải phóng mã ưu đãi cũ.');

                            conn.query(
                                `UPDATE registrations
                                 SET price = ?, discount_code_id = NULL, discount_amount = 0
                                 WHERE id = ?`,
                                [basePrice, invoiceId],
                                (errUpdateReg) => {
                                    if (errUpdateReg) return fail('Lỗi cập nhật hóa đơn.');

                                    conn.query(
                                        "DELETE FROM payos_payments WHERE registration_id = ?",
                                        [invoiceId],
                                        (errDeletePayOS) => {
                                            if (errDeletePayOS) return fail('Lỗi cập nhật thông tin thanh toán.');

                                            conn.commit((commitErr) => {
                                                if (commitErr) return fail('Lỗi lưu thay đổi.');
                                                conn.release();
                                                res.json({
                                                    ok: true,
                                                    message: 'Hủy mã ưu đãi thành công!',
                                                    final_price: basePrice
                                                });
                                            });
                                        }
                                    );
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
