const db = require('../config/db');
const mailer = require('../lib/mailer');
const { STATUS } = require('../lib/status');

function buildMonthRange(date = new Date()) {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const lastDay = new Date(year, month, 0).getDate();
    const validFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const validTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { month, year, validFrom, validTo };
}

function runOnce({ baseUrl } = {}) {
    return new Promise((resolve) => {
        const { month, year, validFrom, validTo } = buildMonthRange();

        db.query(
            `SELECT id, fullname, email FROM members
             WHERE role = 'member'
               AND birth_date IS NOT NULL
               AND MONTH(birth_date) = ?`,
            [month],
            (err, members) => {
                if (err) {
                    console.error('[birthdayJob] load members:', err.message);
                    return resolve({ created: 0, mailed: 0, error: err.message });
                }
                const candidates = members || [];
                if (candidates.length === 0) {
                    return resolve({ created: 0, mailed: 0 });
                }

                let processed = 0, created = 0, mailed = 0;

                const next = () => {
                    if (processed >= candidates.length) {
                        if (created > 0 || mailed > 0) {
                            console.log(`[birthdayJob] tháng ${month}/${year}: tạo ${created} mã, gửi ${mailed} email`);
                        }
                        return resolve({ created, mailed });
                    }
                    const m = candidates[processed++];
                    const code = `BDAY-${m.id}-${year}${String(month).padStart(2, '0')}`;
                    db.query(
                        `INSERT IGNORE INTO discount_codes
                         (code, description, discount_type, discount_value, min_amount, valid_from, valid_to, usage_limit, is_birthday, member_id, status)
                         VALUES (?, ?, 'percent', 15, 0, ?, ?, 1, 1, ?, ?)`,
                        [code, `Quà sinh nhật tháng ${month} cho ${m.fullname}`, validFrom, validTo, m.id, STATUS.DISCOUNT.ACTIVE],
                        (insErr, result) => {
                            if (insErr) {
                                console.error('[birthdayJob] insert', insErr.message);
                                return next();
                            }
                            if (result.affectedRows > 0) {
                                created += 1;
                                if (m.email && mailer.isEnabled()) {
                                    const tpl = mailer.birthdayCodeTemplate({
                                        fullname: m.fullname,
                                        code,
                                        discountText: 'Giảm 15% cho gói tập tiếp theo',
                                        validTo: new Date(validTo).toLocaleDateString('vi-VN'),
                                        loginUrl: (baseUrl || '') + '/login'
                                    });
                                    return mailer.sendMail({ to: m.email, ...tpl })
                                        .then(() => { mailed += 1; })
                                        .catch((e) => console.error('[birthdayJob] mail', e.message))
                                        .finally(next);
                                }
                            }
                            next();
                        }
                    );
                };
                next();
            }
        );
    });
}

let intervalHandle = null;

function start({ baseUrl } = {}) {
    setTimeout(() => {
        runOnce({ baseUrl }).catch(e => console.error('[birthdayJob] boot run', e.message));
    }, 5000);

    if (intervalHandle) clearInterval(intervalHandle);
    intervalHandle = setInterval(() => {
        runOnce({ baseUrl }).catch(e => console.error('[birthdayJob] interval run', e.message));
    }, 24 * 60 * 60 * 1000);
}

function runForMember(memberId, { baseUrl } = {}) {
    return new Promise((resolve) => {
        const id = Number(memberId);
        if (!Number.isFinite(id) || id <= 0) {
            return resolve({ created: 0, mailed: 0, reason: 'invalid_id' });
        }
        const { month, year, validFrom, validTo } = buildMonthRange();

        db.query(
            `SELECT id, fullname, email FROM members
             WHERE id = ? AND role = 'member'
               AND birth_date IS NOT NULL
               AND MONTH(birth_date) = ?`,
            [id, month],
            (err, rows) => {
                if (err) {
                    console.error('[birthdayJob.runForMember] query', err.message);
                    return resolve({ created: 0, mailed: 0, error: err.message });
                }
                if (!rows || rows.length === 0) {
                    return resolve({ created: 0, mailed: 0, reason: 'not_birthday_month' });
                }
                const m = rows[0];
                const code = `BDAY-${m.id}-${year}${String(month).padStart(2, '0')}`;
                db.query(
                    `INSERT IGNORE INTO discount_codes
                     (code, description, discount_type, discount_value, min_amount, valid_from, valid_to, usage_limit, is_birthday, member_id, status)
                     VALUES (?, ?, 'percent', 15, 0, ?, ?, 1, 1, ?, ?)`,
                    [code, `Quà sinh nhật tháng ${month} cho ${m.fullname}`, validFrom, validTo, m.id, STATUS.DISCOUNT.ACTIVE],
                    (insErr, result) => {
                        if (insErr) {
                            console.error('[birthdayJob.runForMember] insert', insErr.message);
                            return resolve({ created: 0, mailed: 0, error: insErr.message });
                        }
                        if (result.affectedRows === 0) {
                            return resolve({ created: 0, mailed: 0, reason: 'already_exists' });
                        }
                        if (m.email && mailer.isEnabled()) {
                            const tpl = mailer.birthdayCodeTemplate({
                                fullname: m.fullname,
                                code,
                                discountText: 'Giảm 15% cho gói tập tiếp theo',
                                validTo: new Date(validTo).toLocaleDateString('vi-VN'),
                                loginUrl: (baseUrl || '') + '/login'
                            });
                            mailer.sendMail({ to: m.email, ...tpl })
                                .then(() => {
                                    console.log(`[birthdayJob.runForMember] đã tạo + gửi mã ${code} cho ${m.fullname}`);
                                    resolve({ created: 1, mailed: 1, code });
                                })
                                .catch((e) => {
                                    console.error('[birthdayJob.runForMember] mail', e.message);
                                    resolve({ created: 1, mailed: 0, code, error: e.message });
                                });
                        } else {
                            console.log(`[birthdayJob.runForMember] đã tạo mã ${code} cho ${m.fullname} (không có email)`);
                            resolve({ created: 1, mailed: 0, code });
                        }
                    }
                );
            }
        );
    });
}

module.exports = { start, runOnce, runForMember };
