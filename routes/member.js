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
    const member_id = req.params.id;
    const { package_id, trainer_id, schedule } = req.body;
    const registration_date = new Date().toISOString().split('T')[0];

    db.query("SELECT price, duration_months FROM packages WHERE id = ?", [package_id], (err, pkgResult) => {
        if (err || pkgResult.length === 0) return res.status(500).send("Lỗi dữ liệu gói tập");
        
        const price = pkgResult[0].price;
        const duration = pkgResult[0].duration_months;
        
        let expDate = new Date();
        expDate.setMonth(expDate.getMonth() + duration);
        const expiration_date = expDate.toISOString().split('T')[0];
        
        const t_id = trainer_id ? trainer_id : null;

        const insertSql = `
            INSERT INTO registrations (member_id, package_id, trainer_id, price, registration_date, expiration_date, schedule, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `;
        db.query(insertSql, [member_id, package_id, t_id, price, registration_date, expiration_date, schedule], (err, result) => {
            if (err) return res.status(500).send("Lỗi xử lý đăng ký");
            res.redirect(`/members/view/${member_id}`);
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

module.exports = router;