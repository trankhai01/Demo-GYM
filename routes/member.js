const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt"); 
const { requireStaff } = require('../middleware/auth');
const { STATUS } = require('../lib/status');

router.get('/',requireStaff, (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const searchQuery = req.query.q || '';      
    const error = req.query.error || null; 
    const limit = 10;                            
    const offset = (page - 1) * limit;          

    const searchSql = `%${searchQuery}%`;
    const countSql = "SELECT COUNT(*) as total FROM members WHERE fullname LIKE ? OR phone LIKE ?";
    const dataSql = "SELECT * FROM members WHERE fullname LIKE ? OR phone LIKE ? ORDER BY id ASC LIMIT ? OFFSET ?";

    db.query(countSql, [searchSql, searchSql], (err, countResult) => {
        if (err) return res.status(500).send("Lỗi đếm dữ liệu");
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1; 

        db.query(dataSql, [searchSql, searchSql, limit, offset], (err, members) => {
            if (err) return res.status(500).send("Lỗi truy vấn dữ liệu");
            res.render('members/index', {
                members: members,
                currentPage: page,
                totalPages: totalPages,
                searchQuery: searchQuery,
                error: error,
                pageOffset: offset,
                pageLimit: limit
            });
        });
    });
});


router.get("/add",requireStaff, (req, res) => {
  res.render("members/add");
});

router.post("/add",requireStaff, (req, res) => {
    const { fullname, phone, gender, email } = req.body;
    const join_date = new Date().toISOString().split('T')[0];
    const cleanEmail = email && email.trim() ? email.trim() : null;
    const checkSql = "SELECT id FROM members WHERE phone = ?";
    db.query(checkSql, [phone], async (err, results) => {
        if (err) return res.status(500).send("Lỗi DB");
        if (results.length > 0) {
            return res.redirect('/members?error=duplicate_phone');
        }
        try {
            const defaultPassword = await bcrypt.hash(phone, 10);
            const insertSql = "INSERT INTO members (fullname, phone, email, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, ?, 'member')";
            db.query(insertSql, [fullname, phone, cleanEmail, gender, join_date, defaultPassword], () => {
                res.redirect("/members");
            });
        } catch (error) {
            res.status(500).send("Lỗi mã hóa");
        }
    });
});

router.get('/view/:id', requireStaff, (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM members WHERE id = ?", [id], (err, memberResult) => {
        if (err || memberResult.length === 0) return res.redirect('/members');
        db.query("SELECT * FROM packages", (err, packages) => {
            db.query("SELECT * FROM trainers", (err, trainers) => {
                const historySql = `
                    SELECT r.*, p.package_name
                    FROM registrations r
                    JOIN packages p ON r.package_id = p.id
                    WHERE r.member_id = ?
                    ORDER BY r.id DESC
                `;
                db.query(historySql, [id], (err, history) => {
                    res.render('members/view', { 
                        member: memberResult[0], 
                        packages: packages || [], 
                        trainers: trainers || [], 
                        history: history || [] 
                    });
                });
            });
        });
    });
});

router.post('/view/:id/register', requireStaff, (req, res) => {
    const memberId = Number(req.params.id);
    const packageId = Number(req.body.package_id);

    if (!Number.isInteger(memberId) || memberId <= 0 || !Number.isInteger(packageId) || packageId <= 0) {
        return res.status(400).send('Dữ liệu đăng ký không hợp lệ');
    }

    db.getConnection((err, conn) => {
        if (err) return res.status(500).send('Không lấy được kết nối DB');

        const fail = (message, sqlErr) => {
            if (sqlErr) console.error('[member /view/:id/register]', sqlErr.message);
            conn.rollback(() => {
                conn.release();
                res.status(500).send(message);
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).send('Lỗi mở transaction');
            }

            // Guard bao gồm cả Pending để staff submit hai lần không tạo registration trùng.
            conn.query(
                `SELECT id FROM registrations
                 WHERE member_id = ?
                   AND status = ?
                   AND payment_status IN (?, ?)
                   AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE())
                 LIMIT 1
                 FOR UPDATE`,
                [memberId, STATUS.REGISTRATION.ACTIVE, STATUS.PAYMENT.SUCCESS, STATUS.PAYMENT.PENDING],
                (err, activePkgs) => {
                    if (err) return fail('Lỗi kiểm tra gói tập hiện tại', err);
                    if (activePkgs && activePkgs.length > 0) {
                        return conn.rollback(() => {
                            conn.release();
                            res.redirect(`/members/view/${memberId}?notice=active_package_exists`);
                        });
                    }

                    conn.query("SELECT * FROM packages WHERE id = ? FOR UPDATE", [packageId], (err, pkgs) => {
                        if (err) return fail('Lỗi gói tập', err);
                        if (!pkgs || pkgs.length === 0) return fail('Gói tập không tồn tại');

                        const pkg = pkgs[0];
                        const regDate = new Date().toISOString().split('T')[0];

                        let expDate = new Date();
                        expDate.setMonth(expDate.getMonth() + Number(pkg.duration_months || 0));
                        const expDateStr = expDate.toISOString().split('T')[0];

                        const sql = `
                            INSERT INTO registrations
                            (member_id, package_id, price, registration_date, expiration_date, total_sessions, payment_status, payment_method, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 'Tiền mặt', ?)
                        `;
                        const params = [
                            memberId,
                            packageId,
                            pkg.price,
                            regDate,
                            expDateStr,
                            pkg.pt_sessions || 0,
                            STATUS.PAYMENT.PENDING,
                            STATUS.REGISTRATION.ACTIVE
                        ];

                        conn.query(sql, params, (err, result) => {
                            if (err) return fail('Lỗi tạo hóa đơn', err);
                            conn.commit((err) => {
                                if (err) return fail('Lỗi commit', err);
                                conn.release();
                                res.redirect('/registrations/checkout/' + result.insertId);
                            });
                        });
                    });
                }
            );
        });
    });
});

// Xóa tuần tự các bảng tham chiếu trong transaction để atomic, không dựa vào FK CASCADE
// (XAMPP/MariaDB cũ có thể tắt enforcement, để lại dữ liệu rác).
router.post("/delete/:id", requireStaff, (req, res) => {
    const id = req.params.id;

    db.getConnection((err, conn) => {
        if (err) return res.status(500).send("Không lấy được kết nối DB");

        const fail = (msg) => {
            console.error('[members/delete]', msg);
            conn.rollback(() => {
                conn.release();
                res.redirect('/members?notice=delete_error');
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).send("Lỗi mở transaction");
            }

            const steps = [
                'DELETE pt FROM pt_sessions_log pt JOIN registrations r ON pt.registration_id = r.id WHERE r.member_id = ?',
                'DELETE rd FROM registration_details rd JOIN registrations r ON rd.registration_id = r.id WHERE r.member_id = ?',
                'DELETE FROM registrations WHERE member_id = ?',
                'DELETE FROM bookings WHERE member_id = ?',
                'DELETE FROM checkin_history WHERE member_id = ?',
                'DELETE FROM password_reset_requests WHERE member_id = ?',
                'DELETE FROM members WHERE id = ?'
            ];

            let i = 0;
            const next = () => {
                if (i >= steps.length) {
                    return conn.commit((err) => {
                        if (err) return fail("Lỗi commit: " + err.message);
                        conn.release();
                        res.redirect("/members?notice=delete_success");
                    });
                }
                conn.query(steps[i++], [id], (err) => {
                    if (err) return fail("Lỗi xóa dữ liệu hội viên: " + err.message);
                    next();
                });
            };
            next();
        });
    });
});

router.get("/edit/:id",requireStaff, (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM members WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err || result.length === 0) return res.redirect("/members");
    res.render("members/edit", { member: result[0] });
  });
});

router.post("/edit/:id",requireStaff, (req, res) => {
    const id = req.params.id;
    const {
        fullname, phone, email, gender,
        cccd, birth_year, birth_date, height, weight, hometown, address
    } = req.body;
    let resolvedBirthYear = birth_year || null;
    if (birth_date) {
        const y = Number(String(birth_date).slice(0, 4));
        if (Number.isFinite(y) && y > 1900) resolvedBirthYear = y;
    }

    const checkSql = "SELECT id FROM members WHERE phone = ? AND id != ?";
    db.query(checkSql, [phone, id], (err, results) => {
        if (err) return res.status(500).send("Lỗi hệ thống");

        if (results.length > 0) return res.redirect(`/members/edit/${id}?notice=duplicate_phone`);

        const updateSql = `
            UPDATE members
            SET fullname = ?, phone = ?, email = ?, gender = ?,
                cccd = ?, birth_year = ?, birth_date = ?, height = ?, weight = ?,
                hometown = ?, address = ?
            WHERE id = ?
        `;

        const values = [
            fullname, phone, (email && email.trim()) ? email.trim() : null, gender,
            cccd || null, resolvedBirthYear, birth_date || null, height || null, weight || null,
            hometown || null, address || null,
            id
        ];

        db.query(updateSql, values, (err) => {
            if (err) return res.status(500).send("Lỗi cập nhật: " + err.message);

            if (birth_date) {
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                require('../lib/birthdayJob').runForMember(id, { baseUrl })
                    .catch(e => console.error('[member/edit -> birthdayJob]', e.message));
            }

            res.redirect(`/members/view/${id}`);
        });
    });
});

// trainer_id null → "tự tập". Yêu cầu hóa đơn đã thanh toán mới cho điểm danh.
router.post('/deduct-session', requireStaff, (req, res) => {
    const { registration_id, member_id, trainer_id, note } = req.body;
    const tid = trainer_id && String(trainer_id).trim() !== '' ? Number(trainer_id) : null;
    db.query("SELECT total_sessions, used_sessions, payment_status FROM registrations WHERE id = ?", [registration_id], (err, results) => {
        if (err || results.length === 0) return res.status(500).send("Lỗi hệ thống");

        const reg = results[0];
        if (reg.payment_status !== STATUS.PAYMENT.SUCCESS) {
            return res.status(400).send("Gói tập chưa thanh toán — không thể điểm danh!");
        }
        if (reg.used_sessions >= reg.total_sessions) {
            return res.status(400).send("Gói tập này đã hết số buổi!");
        }

        db.query("UPDATE registrations SET used_sessions = used_sessions + 1 WHERE id = ?", [registration_id], (err) => {
            if (err) return res.status(500).send("Lỗi cập nhật số buổi");
            db.query("INSERT INTO pt_sessions_log (registration_id, member_id, trainer_id, note) VALUES (?, ?, ?, ?)",
                [registration_id, member_id, tid, note || 'Hoàn thành buổi tập'], (err) => {
                    if (err) console.error('[deduct-session]', err.message);
                    res.redirect('/members/view/' + member_id);
                });
        });
    });
});
module.exports = router;
