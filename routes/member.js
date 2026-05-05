const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt"); 
const { requireStaff } = require('../middleware/auth');

router.get('/',requireStaff, (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const searchQuery = req.query.q || '';      
    const error = req.query.error || null; 
    const limit = 10;                            
    const offset = (page - 1) * limit;          

    const searchSql = `%${searchQuery}%`;
    const countSql = "SELECT COUNT(*) as total FROM members WHERE fullname LIKE ? OR phone LIKE ?";
    const dataSql = "SELECT * FROM members WHERE fullname LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?";

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
                error: error 
            });
        });
    });
});


router.get("/add",requireStaff, (req, res) => {
  res.render("members/add");
});

router.post("/add",requireStaff, (req, res) => {
    const { fullname, phone, gender } = req.body;
    const join_date = new Date().toISOString().split('T')[0];
    const checkSql = "SELECT id FROM members WHERE phone = ?";
    db.query(checkSql, [phone], async (err, results) => {
        if (err) return res.status(500).send("Lỗi DB");
        if (results.length > 0) {
            return res.redirect('/members?error=duplicate_phone'); 
        }
        try {
            const defaultPassword = await bcrypt.hash(phone, 10);
            const insertSql = "INSERT INTO members (fullname, phone, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, 'member')";
            db.query(insertSql, [fullname, phone, gender, join_date, defaultPassword], (err, result) => {
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

// Đăng ký gói từ trang chi tiết hội viên. Tạo hóa đơn ở trạng thái
// Pending rồi điều hướng sang màn hình checkout để staff xác nhận thanh
// toán (giống luồng POS /add-complex). Trước đây route này lưu thẳng
// Success không qua checkout → thiếu nhất quán + bỏ qua bước xác nhận phương
// thức thanh toán.
router.post('/view/:id/register', requireStaff, (req, res) => {
    const memberId = req.params.id;
    const { package_id } = req.body;

    // Guard phải bao gồm cả Pending: sau khi tạo hóa đơn staff có thể
    // back về rồi submit lại → tạo registration thứ hai cho cùng member.
    // Cả hai sau đó có thể checkout độc lập → member có 2 gói trùng.
    db.query("SELECT id FROM registrations WHERE member_id = ? AND expiration_date >= CURRENT_DATE() AND status = 'active' AND payment_status IN ('Success', 'Pending')", [memberId], (err, activePkgs) => {
        if (activePkgs && activePkgs.length > 0) {
            return res.send("<script>alert('TỪ CHỐI: Hội viên này đang có gói tập chưa hết hạn!'); window.history.back();</script>");
        }
        db.query("SELECT * FROM packages WHERE id = ?", [package_id], (err, pkgs) => {
            if (err || pkgs.length === 0) return res.status(500).send("Lỗi gói tập");

            const pkg = pkgs[0];
            const regDate = new Date().toISOString().split('T')[0];

            let expDate = new Date();
            expDate.setMonth(expDate.getMonth() + pkg.duration_months);
            const expDateStr = expDate.toISOString().split('T')[0];

            const sql = `
                INSERT INTO registrations
                (member_id, package_id, price, registration_date, expiration_date, total_sessions, payment_status, payment_method, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Tiền mặt', 'active')
            `;
            db.query(sql, [memberId, package_id, pkg.price, regDate, expDateStr, pkg.pt_sessions || 0], (err, result) => {
                if (err) {
                    console.error('[member /view/:id/register]', err.message);
                    return res.status(500).send('Lỗi tạo hóa đơn');
                }
                res.redirect('/registrations/checkout/' + result.insertId);
            });
        });
    });
});

// Xóa hội viên: phải dọn sạch dữ liệu liên quan trước khi xóa record
// trong members. Mặc dù schema có ON DELETE CASCADE cho bookings/checkin/
// pt_sessions_log/password_reset_requests, môi trường cũ (XAMPP MySQL,
// MariaDB) có thể tắt FK enforcement → để lại dữ liệu rác. Xóa tường minh
// từng bảng trong transaction để đảm bảo atomic và không phụ thuộc FK.
// registrations giữ lại với member_id = NULL (qua ON DELETE SET NULL)
// nhưng ở đây xóa luôn cho sạch sẽ — dữ liệu doanh thu không bị
// orphan vì người dùng đã chủ động xóa hội viên.
router.post("/delete/:id", requireStaff, (req, res) => {
    const id = req.params.id;

    db.getConnection((err, conn) => {
        if (err) return res.status(500).send("Không lấy được kết nối DB");

        const fail = (msg) => {
            conn.rollback(() => {
                conn.release();
                res.status(500).send(msg);
            });
        };

        conn.beginTransaction((err) => {
            if (err) {
                conn.release();
                return res.status(500).send("Lỗi mở transaction");
            }

            // Thứ tự quan trọng: những bảng tham chiếu registrations phải
            // xóa trước registrations (pt_sessions_log, registration_details).
            // Các bảng tham chiếu members — sau đó — rồi xóa members cuối cùng.
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
                        res.redirect("/members");
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
        fullname, phone, gender, 
        cccd, birth_year, height, weight, hometown, address 
    } = req.body;

    const checkSql = "SELECT id FROM members WHERE phone = ? AND id != ?";
    db.query(checkSql, [phone, id], (err, results) => {
        if (err) return res.status(500).send("Lỗi hệ thống");

        if (results.length > 0) {
            return res.send(`
                <script>
                    alert('Lỗi: Số điện thoại này đã được sử dụng cho hội viên khác!');
                    window.history.back();
                </script>
            `);
        }

        const updateSql = `
            UPDATE members 
            SET fullname = ?, phone = ?, gender = ?, 
                cccd = ?, birth_year = ?, height = ?, weight = ?, 
                hometown = ?, address = ?
            WHERE id = ?
        `;
        
        const values = [
            fullname, phone, gender, 
            cccd || null, birth_year || null, height || null, weight || null, 
            hometown || null, address || null, 
            id
        ];

        db.query(updateSql, values, (err, result) => {
            if (err) return res.status(500).send("Lỗi cập nhật: " + err.message);
            
            res.redirect(`/members/view/${id}`);
        });
    });
});

// Trừ 1 buổi PT. trainer_id lấy từ select trên form (HLV thật của buổi
// hôm đó) — nếu rỗng → "tự tập", lưu NULL vào pt_sessions_log.trainer_id.
// Trước đây trainer_id cố định lấy từ registrations.trainer_id (đã bị
// drop ở migration 005) nên log không phản ánh đúng HLV thực tế.
router.post('/deduct-session', requireStaff, (req, res) => {
    const { registration_id, member_id, trainer_id, note } = req.body;
    const tid = trainer_id && String(trainer_id).trim() !== '' ? Number(trainer_id) : null;
    db.query("SELECT total_sessions, used_sessions, payment_status FROM registrations WHERE id = ?", [registration_id], (err, results) => {
        if (err || results.length === 0) return res.status(500).send("Lỗi hệ thống");

        const reg = results[0];
        // Sau PR #8 hóa đơn được tạo ở trạng thái Pending rồi mới qua
        // checkout xác nhận thanh toán → cấm trừ buổi cho đến khi thanh
        // toán xong, tránh staff trừ buổi cho gói chưa trả tiền.
        if (reg.payment_status !== 'Success') {
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