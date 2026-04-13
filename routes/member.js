const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Kết nối tới file db.js đã tạo

// Lấy danh sách hội viên
router.get("/", (req, res) => {
  const sql = "SELECT * FROM members ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send("Lỗi truy vấn: " + err.message);
    }
    // Trả dữ liệu về file views/members/index.ejs
    res.render("members/index", { members: results });
  });
});

// 1. Trang hiển thị Form thêm hội viên
router.get("/add", (req, res) => {
  res.render("members/add");
});

// 2. Xử lý dữ liệu từ Form gửi lên
router.post("/add", (req, res) => {
  const { fullname, phone, gender } = req.body;
  const sql = "INSERT INTO members (fullname, phone, gender) VALUES (?, ?, ?)";

  db.query(sql, [fullname, phone, gender], (err, result) => {
    if (err) {
      return res.status(500).send("Lỗi khi thêm hội viên: " + err.message);
    }

    res.redirect("/members");
  });
});

router.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  const sql = "DELETE FROM members WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send("Lỗi khi xóa: " + err.message);
    res.redirect("/members");
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
  const sql =
    "UPDATE members SET fullname = ?, phone = ?, gender = ?, role = ? WHERE id = ?";

  db.query(sql, [fullname, phone, gender, role, id], (err, result) => {
    if (err) return res.status(500).send("Lỗi cập nhật: " + err.message);
    res.redirect("/members");
  });
});
router.get('/', (req, res) => {
    // 1. Lấy các tham số từ URL
    const page = parseInt(req.query.page) || 1; // Trang hiện tại (mặc định là 1)
    const searchQuery = req.query.q || '';      // Từ khóa tìm kiếm
    const limit = 5;                            // Số lượng hội viên mỗi trang
    const offset = (page - 1) * limit;          // Vị trí bắt đầu lấy dữ liệu

    // 2. Câu lệnh SQL tìm kiếm và phân trang
    // Dùng LIKE để tìm kiếm theo Tên hoặc Số điện thoại
    const searchSql = `%${searchQuery}%`;
    
    const countSql = "SELECT COUNT(*) as total FROM members WHERE fullname LIKE ? OR phone LIKE ?";
    const dataSql = "SELECT * FROM members WHERE fullname LIKE ? OR phone LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?";

    // 3. Thực hiện truy vấn
    db.query(countSql, [searchSql, searchSql], (err, countResult) => {
        if (err) throw err;

        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        db.query(dataSql, [searchSql, searchSql, limit, offset], (err, members) => {
            if (err) throw err;

            // 4. Trả dữ liệu về view kèm các thông số phân trang
            res.render('members/index', {
                members: members,
                currentPage: page,
                totalPages: totalPages,
                searchQuery: searchQuery
            });
        });
    });
});
module.exports = router;
