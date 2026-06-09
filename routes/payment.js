const express = require('express');
const router = express.Router();
const payosPayment = require('../lib/payosPayment');
const auditLog = require('../lib/auditLog');

router.post('/payos/webhook', async (req, res) => {
    try {
        const data = await payosPayment.verifyWebhook(req.body);
        const orderCode = Number(data.orderCode);
        console.log('[payos/webhook] received', {
            orderCode,
            code: data.code,
            amount: data.amount
        });

        if (!data || data.code !== '00' || !orderCode) {
            return res.json({ success: true });
        }

        payosPayment.markPaid(orderCode, data, (err, result) => {
            if (err) {
                console.error('[payos/webhook markPaid]', err.message);
                return res.status(400).json({ success: false, message: err.message });
            }

            auditLog.record(
                { session: { user: { id: null, role: 'system', username: 'payOS Webhook' } }, ip: req.ip },
                'invoice.confirm_payment',
                'registration',
                result.registrationId,
                { source: 'payos', order_code: orderCode }
            );
            res.json({ success: true });
        });
    } catch (err) {
        console.error('[payos/webhook]', err.message);
        res.status(400).json({ success: false, message: 'Invalid webhook' });
    }
});

module.exports = router;
