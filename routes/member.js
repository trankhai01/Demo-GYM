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

// --- 2. GIAO DIỆN THÊM MỚI ---
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
  const { fullname, phone, gender, role } = req.body;
  
  const sql = "UPDATE members SET fullname = ?, phone = ?, gender = ?, role = ? WHERE id = ?";

  db.query(sql, [fullname, phone, gender, role, id], (err, result) => {
    if (err) return res.status(500).send("Lỗi cập nhật: " + err.message);
    res.redirect("/members");
  });
});

module.exports = router;