const express = require("express");
const router = express.Router();
const db = require("../config/db");
const bcrypt = require("bcrypt"); // Nhớ gọi bcrypt để tạo mật khẩu mặc định khi thêm hội viên

// --- 1. DANH SÁCH (Tìm kiếm & Phân trang) ---
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const searchQuery = req.query.q || '';      
    const limit = 10;                            
    const offset = (page - 1) * limit;          

    const searchSql = `%${searchQuery}%`;
    
    const countSql = "SELECT COUNT(*) as total FROM members WHERE fullname LIKE ? OR phone LIKE ?";
    const dataSql = "SELECT * FROM members WHERE fullname LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?";

    db.query(countSql, [searchSql, searchSql], (err, countResult) => {
        if (err) return res.status(500).send("Lỗi đếm dữ liệu");

        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1; // Nếu trống thì vẫn là 1 trang

        db.query(dataSql, [searchSql, searchSql, limit, offset], (err, members) => {
            if (err) return res.status(500).send("Lỗi truy vấn dữ liệu");

            // Truyền đủ 4 biến sang EJS
            res.render('members/index', {
                members: members,
                currentPage: page,
                totalPages: totalPages,
                searchQuery: searchQuery 
            });
        });
    });
});

// --- 2. GIAO DIỆN THÊM MỚI ---
router.get("/add", (req, res) => {
  res.render("members/add");
});

// --- 3. XỬ LÝ THÊM MỚI ---
router.post("/add", async (req, res) => {
  const { fullname, phone, gender } = req.body;
  const join_date = new Date().toISOString().split('T')[0]; // Lấy ngày hiện tại

  try {
      // Vì DB yêu cầu phải có password, ta lấy luôn Số điện thoại làm mật khẩu mặc định (Mã hóa bcrypt)
      const defaultPassword = await bcrypt.hash(phone, 10);

      const sql = "INSERT INTO members (fullname, phone, gender, join_date, password, role) VALUES (?, ?, ?, ?, ?, 'member')";

      db.query(sql, [fullname, phone, gender, join_date, defaultPassword], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.send("Số điện thoại này đã tồn tại!");
            return res.status(500).send("Lỗi khi thêm hội viên: " + err.message);
        }
        res.redirect("/members");
      });
  } catch (error) {
      res.status(500).send("Lỗi hệ thống");
  }
});

// --- 4. XÓA HỘI VIÊN (Kèm xóa bản đăng ký) ---
router.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  
  // Xóa các gói tập đã đăng ký trước để không bị lỗi Khóa Ngoại (Foreign Key)
  const sqlDeleteRegistrations = "DELETE FROM registrations WHERE member_id = ?";
  db.query(sqlDeleteRegistrations, [id], (err, result) => {
      if (err) return res.status(500).send("Lỗi khi xóa gói tập liên quan: " + err.message);

      // Xong rồi mới xóa hội viên
      const sqlDeleteMember = "DELETE FROM members WHERE id = ?";
      db.query(sqlDeleteMember, [id], (err, result) => {
        if (err) return res.status(500).send("Lỗi khi xóa hội viên: " + err.message);
        res.redirect("/members");
      });
  });
});

// --- 5. GIAO DIỆN SỬA ---
router.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "SELECT * FROM members WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err || result.length === 0) return res.redirect("/members");
    res.render("members/edit", { member: result[0] });
  });
});

// --- 6. XỬ LÝ SỬA ---
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