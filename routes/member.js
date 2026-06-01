const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt"); 
const { requireStaff } = require('../middleware/auth');
const { STATUS } = require('../lib/status');
const { memberPayload } = require('../lib/formValidation');
const auditLog = require('../lib/auditLog');

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
    const payload = memberPayload(req.body);
    if (payload.error) {
        return res.redirect('/members?error=invalid_member');
    }
    const join_date = new Date().toISOString().split('T')[0];
    const checkSql = "SELECT id FROM members WHERE phone = ?";
    db.query(checkSql, [payload.phone], async (err, results) => {
        if (err) return res.status(500).send("Lỗi DB");
        if (results.length > 0) {
            return res.redirect('/members?error=duplicate_phone');
        }
        try {
            const defaultPassword = await bcrypt.hash(payload.phone, 10);
            const insertSql = "INSERT INTO members (fullname, phone, email, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, ?, 'member')";
            db.query(insertSql, [payload.fullname, payload.phone, payload.email, payload.gender, join_date, defaultPassword], (errInsert) => {
                if (errInsert) {
                    if (errInsert.code === 'ER_DUP_ENTRY') return res.redirect('/members?error=duplicate_phone');
                    console.error('[members/add]', errInsert.message);
                    return res.redirect('/members?error=invalid_member');
                }
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
                    const ptLogSql = `
                        SELECT l.id, l.registration_id, l.note, l.created_at,
                               p.package_name,
                               t.fullname AS trainer_name
                        FROM pt_sessions_log l
                        JOIN registrations r ON r.id = l.registration_id
                        LEFT JOIN packages p ON p.id = r.package_id
                        LEFT JOIN trainers t ON t.id = l.trainer_id
                        WHERE l.member_id = ?
                        ORDER BY l.created_at DESC, l.id DESC
                        LIMIT 20
                    `;
                    db.query(ptLogSql, [id], (errLog, ptLogs) => {
                        if (errLog) console.error('[members/view ptLogs]', errLog.message);
                        res.render('members/view', {
                            member: memberResult[0],
                            packages: packages || [],
                            trainers: trainers || [],
                            history: history || [],
                            ptLogs: ptLogs || []
                        });
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

            // Chặn đăng ký gói trùng.
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

// Xóa hội viên và dữ liệu liên quan.
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
                        auditLog.record(req, 'member.delete', 'member', id);
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
    const payload = memberPayload(req.body);
    if (payload.error) {
        return res.redirect(`/members/edit/${id}?notice=invalid_member`);
    }

    const checkSql = "SELECT id FROM members WHERE phone = ? AND id != ?";
    db.query(checkSql, [payload.phone, id], (err, results) => {
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
            payload.fullname, payload.phone, payload.email, payload.gender,
            payload.cccd, payload.birth_year, payload.birth_date, payload.height, payload.weight,
            payload.hometown, payload.address,
            id
        ];

        db.query(updateSql, values, (err) => {
            if (err) return res.status(500).send("Lỗi cập nhật: " + err.message);

            if (payload.birth_date) {
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                require('../lib/birthdayJob').runForMember(id, { baseUrl })
                    .catch(e => console.error('[member/edit -> birthdayJob]', e.message));
            }

            res.redirect(`/members/view/${id}`);
        });
    });
});

// Trừ buổi PT cho hóa đơn đã thanh toán.
router.post('/deduct-session', requireStaff, (req, res) => {
    const registrationId = Number(req.body.registration_id);
    const memberId = Number(req.body.member_id);
    const trainerId = req.body.trainer_id && String(req.body.trainer_id).trim() !== '' ? Number(req.body.trainer_id) : null;
    const note = String(req.body.note || '').trim().slice(0, 255) || 'Hoàn thành buổi tập';

    const redirectTo = Number.isInteger(memberId) && memberId > 0
        ? `/members/view/${memberId}`
        : '/members';
    const withNotice = (notice) => `${redirectTo}?notice=${encodeURIComponent(notice)}`;

    if (!Number.isInteger(registrationId) || registrationId <= 0 || !Number.isInteger(memberId) || memberId <= 0) {
        return res.redirect(withNotice('deduct_invalid'));
    }
    if (trainerId !== null && (!Number.isInteger(trainerId) || trainerId <= 0)) {
        return res.redirect(withNotice('deduct_invalid_trainer'));
    }

    db.getConnection((err, conn) => {
        if (err) return res.redirect(withNotice('deduct_error'));

        const fail = (notice, sqlErr) => {
            if (sqlErr) console.error('[deduct-session]', sqlErr.message);
            conn.rollback(() => {
                conn.release();
                res.redirect(withNotice(notice));
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.redirect(withNotice('deduct_error'));
            }

            conn.query(
                `SELECT id, member_id, total_sessions, used_sessions, payment_status
                 FROM registrations
                 WHERE id = ? AND member_id = ?
                 FOR UPDATE`,
                [registrationId, memberId],
                (err, rows) => {
                    if (err) return fail('deduct_error', err);
                    if (!rows || rows.length === 0) return fail('deduct_not_found');

                    const reg = rows[0];
                    if (reg.payment_status !== STATUS.PAYMENT.SUCCESS) return fail('deduct_unpaid');
                    if (Number(reg.total_sessions || 0) <= 0) return fail('deduct_no_pt');
                    if (Number(reg.used_sessions || 0) >= Number(reg.total_sessions || 0)) return fail('deduct_completed');

                    const checkTrainer = (cb) => {
                        if (trainerId === null) return cb();
                        conn.query(
                            'SELECT id FROM trainers WHERE id = ? AND status = ? LIMIT 1',
                            [trainerId, STATUS.TRAINER.ACTIVE],
                            (errTrainer, trainerRows) => {
                                if (errTrainer) return cb(errTrainer);
                                if (!trainerRows || trainerRows.length === 0) return cb(new Error('inactive_trainer'));
                                cb();
                            }
                        );
                    };

                    checkTrainer((trainerErr) => {
                        if (trainerErr) {
                            return fail(trainerErr.message === 'inactive_trainer' ? 'deduct_invalid_trainer' : 'deduct_error', trainerErr.message === 'inactive_trainer' ? null : trainerErr);
                        }

                        conn.query(
                            `UPDATE registrations
                             SET used_sessions = used_sessions + 1
                             WHERE id = ?
                               AND member_id = ?
                               AND payment_status = ?
                               AND used_sessions < total_sessions`,
                            [registrationId, memberId, STATUS.PAYMENT.SUCCESS],
                            (errUpdate, result) => {
                                if (errUpdate) return fail('deduct_error', errUpdate);
                                if (result.affectedRows === 0) return fail('deduct_completed');

                                conn.query(
                                    "INSERT INTO pt_sessions_log (registration_id, member_id, trainer_id, note) VALUES (?, ?, ?, ?)",
                                    [registrationId, memberId, trainerId, note],
                                    (errLog) => {
                                        if (errLog) return fail('deduct_error', errLog);
                                        conn.commit((errCommit) => {
                                            if (errCommit) return fail('deduct_error', errCommit);
                                            conn.release();
                                            auditLog.record(req, 'pt_session.deduct', 'registration', registrationId, {
                                                member_id: memberId,
                                                trainer_id: trainerId,
                                                note
                                            });
                                            res.redirect(withNotice('deduct_success'));
                                        });
                                    }
                                );
                            }
                        );
                    });
                }
            );
        });
    });
});
module.exports = router;
