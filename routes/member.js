const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt"); 

router.get('/', (req, res) => {
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


router.get("/add", (req, res) => {
  res.render("members/add");
});

router.post("/add", (req, res) => {
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

router.get('/view/:id', (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM members WHERE id = ?", [id], (err, memberResult) => {
        if (err || memberResult.length === 0) return res.redirect('/members');
        db.query("SELECT * FROM packages", (err, packages) => {
            db.query("SELECT * FROM trainers", (err, trainers) => {
                const historySql = `
                    SELECT r.*, p.package_name, t.fullname as trainer_name 
                    FROM registrations r 
                    JOIN packages p ON r.package_id = p.id 
                    LEFT JOIN trainers t ON r.trainer_id = t.id 
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

router.post('/view/:id/register', (req, res) => {
    const memberId = req.params.id;
    const { package_id, trainer_id, schedule } = req.body;

    db.query("SELECT id FROM registrations WHERE member_id = ? AND expiration_date >= CURRENT_DATE() AND status = 'active'", [memberId], (err, activePkgs) => {
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
                (member_id, package_id, trainer_id, price, registration_date, expiration_date, schedule, total_sessions, payment_status, payment_method, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Success', 'Tiền mặt', 'active')
            `;
            db.query(sql, [memberId, package_id, trainer_id || null, pkg.price, regDate, expDateStr, schedule, pkg.pt_sessions || 0], (err) => {
                if (err) console.log(err);
                res.redirect('/members/view/' + memberId);
            });
        });
    });
});

router.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sqlDeleteRegistrations = "DELETE FROM registrations WHERE member_id = ?";
  db.query(sqlDeleteRegistrations, [id], (err, result) => {
      if (err) return res.status(500).send("Lỗi khi xóa gói tập liên quan: " + err.message);
      const sqlDeleteMember = "DELETE FROM members WHERE id = ?";
      db.query(sqlDeleteMember, [id], (err, result) => {
        if (err) return res.status(500).send("Lỗi khi xóa hội viên: " + err.message);
        res.redirect("/members");
      });
  });
});

router.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM members WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err || result.length === 0) return res.redirect("/members");
    res.render("members/edit", { member: result[0] });
  });
});

router.post("/edit/:id", (req, res) => {
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

router.post('/deduct-session', (req, res) => {
    const { registration_id, member_id, trainer_id, note } = req.body;
    db.query("SELECT total_sessions, used_sessions FROM registrations WHERE id = ?", [registration_id], (err, results) => {
        if (err || results.length === 0) return res.status(500).send("Lỗi hệ thống");
        
        const reg = results[0];
        if (reg.used_sessions >= reg.total_sessions) {
            return res.status(400).send("Gói tập này đã hết số buổi!");
        }

        db.query("UPDATE registrations SET used_sessions = used_sessions + 1 WHERE id = ?", [registration_id], (err) => {
            if (err) return res.status(500).send("Lỗi cập nhật số buổi");
            db.query("INSERT INTO pt_sessions_log (registration_id, member_id, trainer_id, note) VALUES (?, ?, ?, ?)", 
            [registration_id, member_id, trainer_id, note || 'Hoàn thành buổi tập'], (err) => {
                res.redirect('/members/view/' + member_id);
            });
        });
    });
});
module.exports = router;