const { PayOS } = require('@payos/node');
const db = require('../config/db');
const { STATUS } = require('./status');
const registrationUpgrade = require('./registrationUpgrade');

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS payos_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    order_code BIGINT NOT NULL UNIQUE,
    payment_link_id VARCHAR(80) NULL,
    checkout_url TEXT NULL,
    qr_code TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    raw_response LONGTEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_payos_registration (registration_id),
    CONSTRAINT fk_payos_registration FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let ensured = false;

function isConfigured() {
    return Boolean(process.env.PAYOS_CLIENT_ID && process.env.PAYOS_API_KEY && process.env.PAYOS_CHECKSUM_KEY);
}

function client() {
    if (!isConfigured()) return null;
    return new PayOS({
        clientId: process.env.PAYOS_CLIENT_ID,
        apiKey: process.env.PAYOS_API_KEY,
        checksumKey: process.env.PAYOS_CHECKSUM_KEY
    });
}

function ensure(callback = () => {}) {
    if (ensured) return callback();
    db.query(CREATE_TABLE_SQL, (err) => {
        if (err) {
            console.error('[payosPayment.ensure]', err.message);
            return callback(err);
        }
        ensured = true;
        callback();
    });
}

function publicBaseUrl(req) {
    const envUrl = String(process.env.PAYOS_PUBLIC_BASE_URL || process.env.APP_BASE_URL || '').trim();
    if (envUrl) return envUrl.replace(/\/+$/, '');
    return `${req.protocol}://${req.get('host')}`;
}

function latestPayment(registrationId, callback) {
    ensure((err) => {
        if (err) return callback(err);
        db.query(
            'SELECT * FROM payos_payments WHERE registration_id = ? ORDER BY id DESC LIMIT 1',
            [registrationId],
            (qErr, rows) => callback(qErr, rows && rows[0] ? rows[0] : null)
        );
    });
}

function createPayment(invoice, req, callback, options = {}) {
    ensure((ensureErr) => {
        if (ensureErr) return callback(ensureErr);
        if (!isConfigured()) {
            return callback(new Error('Chưa cấu hình PAYOS_CLIENT_ID, PAYOS_API_KEY hoặc PAYOS_CHECKSUM_KEY.'));
        }

        const orderCode = Number(`${invoice.id}${Date.now() % 1000000}`);
        const amount = Math.round(Number(invoice.price) || 0);
        if (!Number.isInteger(orderCode) || orderCode <= 0 || amount <= 0) {
            return callback(new Error('Thông tin hóa đơn không hợp lệ để tạo thanh toán payOS.'));
        }

        latestPayment(invoice.id, async (latestErr, existing) => {
            if (latestErr) return callback(latestErr);
            
            let existingAmountMatches = false;
            if (existing && existing.raw_response) {
                try {
                    const parsed = JSON.parse(existing.raw_response);
                    if (parsed && Math.round(Number(parsed.amount)) === amount) {
                        existingAmountMatches = true;
                    }
                } catch (e) {
                    // ignore
                }
            }

            if (existing && existing.status === 'PENDING' && existing.checkout_url && existingAmountMatches) {
                return callback(null, existing);
            }

            const baseUrl = publicBaseUrl(req);
            const description = `GYMBRO ${invoice.id}`;
            const returnPath = options.returnPath || `/membership/checkout/${invoice.id}`;
            const cancelPath = options.cancelPath || `${returnPath}?notice=payos_cancelled`;
            const paymentData = {
                orderCode,
                amount,
                description,
                returnUrl: `${baseUrl}${returnPath}`,
                cancelUrl: `${baseUrl}${cancelPath}`,
                items: [
                    {
                        name: String(invoice.package_name || `Hoa don GYM BRO ${invoice.id}`).slice(0, 120),
                        quantity: 1,
                        price: amount
                    }
                ],
                buyerName: invoice.member_name || undefined,
                buyerPhone: invoice.member_phone || undefined
            };

            try {
                const payment = await client().paymentRequests.create(paymentData);
                db.query(
                    `INSERT INTO payos_payments
                     (registration_id, order_code, payment_link_id, checkout_url, qr_code, status, raw_response)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        payment_link_id = VALUES(payment_link_id),
                        checkout_url = VALUES(checkout_url),
                        qr_code = VALUES(qr_code),
                        status = VALUES(status),
                        raw_response = VALUES(raw_response)`,
                    [
                        invoice.id,
                        orderCode,
                        payment.paymentLinkId || null,
                        payment.checkoutUrl || null,
                        payment.qrCode || null,
                        payment.status || 'PENDING',
                        JSON.stringify(payment)
                    ],
                    (insertErr) => {
                        if (insertErr) return callback(insertErr);
                        callback(null, {
                            registration_id: invoice.id,
                            order_code: orderCode,
                            payment_link_id: payment.paymentLinkId,
                            checkout_url: payment.checkoutUrl,
                            qr_code: payment.qrCode,
                            status: payment.status || 'PENDING',
                            raw_response: JSON.stringify(payment)
                        });
                    }
                );
            } catch (err) {
                callback(err);
            }
        });
    });
}

function markPaid(orderCode, paymentData, callback) {
    ensure((ensureErr) => {
        if (ensureErr) return callback(ensureErr);
        registrationUpgrade.ensure((upgradeEnsureErr) => {
            if (upgradeEnsureErr) return callback(upgradeEnsureErr);

            db.getConnection((err, conn) => {
                if (err) return callback(err);

                const fail = (sqlErr) => {
                    conn.rollback(() => {
                        conn.release();
                        callback(sqlErr);
                    });
                };

                conn.beginTransaction((txErr) => {
                    if (txErr) {
                        conn.release();
                        return callback(txErr);
                    }

                    conn.query(
                        'SELECT registration_id FROM payos_payments WHERE order_code = ? FOR UPDATE',
                        [orderCode],
                        (payErr, payRows) => {
                            if (payErr) return fail(payErr);
                            if (!payRows || payRows.length === 0) return fail(new Error('Không tìm thấy payment link payOS.'));

                            const registrationId = payRows[0].registration_id;
                            conn.query(
                                `SELECT id, member_id, payment_status, price, upgrade_from_registration_id
                                 FROM registrations
                                 WHERE id = ?
                                 FOR UPDATE`,
                                [registrationId],
                                (regErr, regRows) => {
                                    if (regErr) return fail(regErr);
                                    if (!regRows || regRows.length === 0) return fail(new Error('Không tìm thấy hóa đơn.'));

                                    const invoice = regRows[0];
                                    const paidAmount = Number(paymentData.amount) || 0;
                                    const expectedAmount = Math.round(Number(invoice.price) || 0);
                                    if (paidAmount < expectedAmount) {
                                        return fail(new Error('Số tiền payOS báo về thấp hơn tổng hóa đơn.'));
                                    }

                                    const updatePaymentRecord = () => {
                                        conn.query(
                                            `UPDATE payos_payments
                                             SET status = ?, raw_response = ?
                                             WHERE order_code = ?`,
                                            ['PAID', JSON.stringify(paymentData), orderCode],
                                            (paymentErr) => {
                                                if (paymentErr) return fail(paymentErr);
                                                conn.commit((commitErr) => {
                                                    if (commitErr) return fail(commitErr);
                                                    conn.release();
                                                    callback(null, { registrationId });
                                                });
                                            }
                                        );
                                    };

                                    const applyUpgradeIfNeeded = () => {
                                        registrationUpgrade.applyPaidUpgrade(conn, invoice, (upgradeErr) => {
                                            if (upgradeErr) return fail(upgradeErr);
                                            updatePaymentRecord();
                                        });
                                    };

                                    conn.query(
                                        `UPDATE registrations
                                         SET payment_status = ?, payment_method = ?
                                         WHERE id = ?`,
                                        [STATUS.PAYMENT.SUCCESS, 'payOS', registrationId],
                                        (updateErr) => {
                                            if (updateErr) return fail(updateErr);
                                            applyUpgradeIfNeeded();
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
        });
    });
}

function updatePaymentSnapshot(orderCode, paymentData, callback) {
    ensure((ensureErr) => {
        if (ensureErr) return callback(ensureErr);
        db.query(
            `UPDATE payos_payments
             SET status = ?, raw_response = ?
             WHERE order_code = ?`,
            [paymentData.status || 'PENDING', JSON.stringify(paymentData), orderCode],
            callback
        );
    });
}

function syncPayment(registrationId, callback) {
    ensure((ensureErr) => {
        if (ensureErr) return callback(ensureErr);
        if (!isConfigured()) return callback(null, { paid: false, payment: null });

        latestPayment(registrationId, async (latestErr, existing) => {
            if (latestErr) return callback(latestErr);
            if (!existing || !existing.order_code) {
                return callback(null, { paid: false, payment: null });
            }

            const orderCode = Number(existing.order_code);
            try {
                const payment = await client().paymentRequests.get(orderCode);
                const status = String(payment.status || '').toUpperCase();
                const paidAmount = Number(payment.amountPaid || payment.amount || 0);
                const snapshot = {
                    ...payment,
                    status,
                    amount: paidAmount
                };

                if (status === 'PAID') {
                    return markPaid(orderCode, snapshot, (markErr, result) => {
                        if (markErr) return callback(markErr);
                        callback(null, { paid: true, payment: snapshot, result });
                    });
                }

                updatePaymentSnapshot(orderCode, snapshot, (updateErr) => {
                    if (updateErr) return callback(updateErr);
                    callback(null, { paid: false, payment: snapshot });
                });
            } catch (err) {
                callback(err);
            }
        });
    });
}

async function verifyWebhook(body) {
    const payos = client();
    if (!payos) throw new Error('Chưa cấu hình payOS.');
    return payos.webhooks.verify(body);
}

module.exports = {
    ensure,
    isConfigured,
    createPayment,
    latestPayment,
    markPaid,
    syncPayment,
    verifyWebhook
};
