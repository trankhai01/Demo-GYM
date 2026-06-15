const db = require('../config/db');
const { STATUS } = require('./status');

const UPGRADED_STATUS = STATUS.REGISTRATION.UPGRADED;

const COLUMNS = [
    {
        name: 'upgrade_from_registration_id',
        ddl: 'ALTER TABLE registrations ADD COLUMN upgrade_from_registration_id INT NULL AFTER status'
    },
    {
        name: 'upgrade_credit_amount',
        ddl: 'ALTER TABLE registrations ADD COLUMN upgrade_credit_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER upgrade_from_registration_id'
    },
    {
        name: 'upgrade_total_days',
        ddl: 'ALTER TABLE registrations ADD COLUMN upgrade_total_days INT NULL AFTER upgrade_credit_amount'
    },
    {
        name: 'upgrade_days_remaining',
        ddl: 'ALTER TABLE registrations ADD COLUMN upgrade_days_remaining INT NULL AFTER upgrade_total_days'
    }
];

let ensured = false;

function ensure(callback = () => {}) {
    if (ensured) return callback();

    let idx = 0;
    const next = () => {
        if (idx >= COLUMNS.length) {
            ensured = true;
            return callback();
        }

        const column = COLUMNS[idx++];
        db.query(
            `SELECT COUNT(*) AS c
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'registrations'
               AND COLUMN_NAME = ?`,
            [column.name],
            (err, rows) => {
                if (err) {
                    console.error('[registrationUpgrade.ensure]', err.message);
                    return callback(err);
                }
                if (rows && rows[0] && Number(rows[0].c) > 0) return next();

                db.query(column.ddl, (alterErr) => {
                    if (alterErr) {
                        console.error('[registrationUpgrade.ensure]', alterErr.message);
                        return callback(alterErr);
                    }
                    next();
                });
            }
        );
    };

    next();
}

function dateOnly(value) {
    const d = value instanceof Date ? value : new Date(value);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function toSqlDate(value) {
    const d = dateOnly(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function addMonths(value, months) {
    const d = dateOnly(value);
    const day = d.getDate();
    d.setMonth(d.getMonth() + Number(months || 0));

    if (d.getDate() !== day) {
        d.setDate(0);
    }
    return d;
}

function daysBetween(start, end) {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((dateOnly(end) - dateOnly(start)) / msPerDay));
}

function calculateUpgrade(current, target, todayValue = new Date()) {
    const registrationDate = dateOnly(current.registration_date);
    const expirationDate = dateOnly(current.expiration_date);
    const today = dateOnly(todayValue);

    const currentPaid = current.upgrade_from_registration_id
        ? Math.round((Number(current.price) || 0) + (Number(current.upgrade_credit_amount) || 0))
        : Math.round(Number(current.price) || 0);
    const currentPackagePrice = Math.round(Number(current.package_price || current.price) || 0);
    const targetPrice = Math.round(Number(target.price) || 0);

    if (!current.expiration_date || expirationDate < today) {
        throw new Error('Gói hiện tại đã hết hạn nên không thể nâng cấp.');
    }
    if (Number(current.package_id) === Number(target.id)) {
        throw new Error('Hội viên đang sử dụng gói này.');
    }
    if (targetPrice <= currentPackagePrice) {
        throw new Error('Chỉ hỗ trợ nâng cấp lên gói có giá cao hơn gói hiện tại.');
    }

    const totalDays = Math.max(1, daysBetween(registrationDate, expirationDate));
    const daysRemaining = Math.min(totalDays, daysBetween(today, expirationDate));
    const creditAmount = Math.round((currentPaid * daysRemaining) / totalDays);
    const amountDue = Math.max(0, targetPrice - creditAmount);

    if (amountDue <= 0) {
        throw new Error('Phần còn lại của gói hiện tại lớn hơn hoặc bằng gói mới.');
    }

    const targetExpirationDate = addMonths(registrationDate, target.duration_months);
    if (targetExpirationDate <= today) {
        throw new Error('Thời hạn gói nâng cấp không còn hiệu lực so với ngày hiện tại.');
    }

    const targetPtSessions = Number(target.pt_sessions) || 0;
    const usedSessions = Math.min(Number(current.used_sessions) || 0, targetPtSessions);

    return {
        amountDue,
        creditAmount,
        totalDays,
        daysRemaining,
        registrationDate: toSqlDate(registrationDate),
        expirationDate: toSqlDate(targetExpirationDate),
        usedSessions,
        totalSessions: targetPtSessions
    };
}

function applyPaidUpgrade(conn, invoice, callback) {
    const oldRegistrationId = Number(invoice.upgrade_from_registration_id || 0);
    if (!oldRegistrationId) return callback();

    conn.query(
        `UPDATE registrations
         SET status = ?
         WHERE id = ?
           AND member_id = ?
           AND status = ?`,
        [UPGRADED_STATUS, oldRegistrationId, invoice.member_id, STATUS.REGISTRATION.ACTIVE],
        callback
    );
}

module.exports = {
    UPGRADED_STATUS,
    ensure,
    calculateUpgrade,
    applyPaidUpgrade
};
