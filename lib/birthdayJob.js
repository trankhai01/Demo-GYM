/**
 * Tự động sinh mã ưu đãi sinh nhật + gửi email cho hội viên trong tháng hiện tại.
 *
 * - Chạy 1 lần khi app khởi động.
 * - Chạy lặp lại mỗi 24h (đảm bảo bắt được lúc bước qua tháng mới).
 * - Dùng INSERT IGNORE → an toàn khi gọi nhiều lần (không trùng mã).
 * - Chỉ gửi email cho hội viên có email và khi mã được tạo MỚI.
 */

const db = require('../config/db');
const mailer = require('../lib/mailer');

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

        /* Chỉ chọn hội viên có ngày sinh trong tháng hiện tại */
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
                         VALUES (?, ?, 'percent', 15, 0, ?, ?, 1, 1, ?, 'active')`,
                        [code, `Quà sinh nhật tháng ${month} cho ${m.fullname}`, validFrom, validTo, m.id],
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
    /* Chạy ngay khi app boot (delay 5s cho DB pool sẵn sàng) */
    setTimeout(() => {
        runOnce({ baseUrl }).catch(e => console.error('[birthdayJob] boot run', e.message));
    }, 5000);

    /* Lặp lại mỗi 24h */
    if (intervalHandle) clearInterval(intervalHandle);
    intervalHandle = setInterval(() => {
        runOnce({ baseUrl }).catch(e => console.error('[birthdayJob] interval run', e.message));
    }, 24 * 60 * 60 * 1000);
}

module.exports = { start, runOnce };
