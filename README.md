# Demo-GYM — Hệ thống quản trị phòng tập

Ứng dụng web Node.js + Express 5 + EJS + MySQL phục vụ vận hành phòng tập gym:
quản lý hội viên, gói tập, huấn luyện viên, kho hàng (POS), check-in, hồ sơ
cá nhân của hội viên và báo cáo doanh thu.

## Stack

- **Backend:** Node.js, Express 5
- **View:** EJS (server-side render) + Bootstrap 5
- **Database:** MySQL 8 (qua `mysql2` connection pool, SQL thuần đã tham số hóa)
- **Auth:** `express-session` (cookie HttpOnly) + `bcrypt`
- **Bảo mật:** `helmet`, `csrf-sync` (CSRF), `express-rate-limit` (chống brute-force ở `/login`)

## Cài đặt nhanh

```bash
# 1. Cài dependencies
npm install

# 2. Copy file môi trường mẫu và điền thông tin
cp .env.example .env
# Sửa DB_HOST / DB_USER / DB_PASSWORD / DB_NAME / SESSION_SECRET

# 3. Tạo database & schema
mysql -u root -p < schema.sql

# 3b. (Nâng cấp DB cũ) Nếu DB đã tồn tại từ trước, chạy lần lượt các migration:
mysql -u root -p quan_ly_gym < migrations/001-add-checkout-time.sql
mysql -u root -p quan_ly_gym < migrations/002-add-bookings.sql
mysql -u root -p quan_ly_gym < migrations/003-add-password-resets.sql
mysql -u root -p quan_ly_gym < migrations/004-add-member-avatar.sql

# 4. Chạy server
node app.js
# Server: http://localhost:3000
```

Sau khi chạy `schema.sql`, có sẵn 1 tài khoản admin mặc định:

| Số điện thoại | Mật khẩu  | Vai trò |
|--------------|-----------|---------|
| `0000000000` | `admin123`| admin   |

> **Đổi mật khẩu admin ngay** sau khi đăng nhập lần đầu (`/profile/change-password`).

## Biến môi trường

| Biến             | Bắt buộc | Mặc định      | Mô tả                                   |
|------------------|----------|---------------|------------------------------------------|
| `DB_HOST`        |          | `localhost`   | Host MySQL                               |
| `DB_USER`        |          | `root`        | User MySQL                               |
| `DB_PASSWORD`    |          | (rỗng)        | Mật khẩu MySQL                           |
| `DB_NAME`        |          | `quan_ly_gym` | Tên database                             |
| `SESSION_SECRET` | ✓ (prod) | (rỗng)        | Secret ký session — bắt buộc khi `NODE_ENV=production` |
| `NODE_ENV`       |          | `development` | Set `production` khi deploy              |
| `PORT`           |          | `3000`        | Cổng HTTP                                |

Tạo `SESSION_SECRET` ngẫu nhiên:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Cấu trúc thư mục

```
.
├── app.js                  # Entry point, mount middleware + router
├── config/db.js            # MySQL connection pool
├── middleware/auth.js      # requireLogin / requireStaff / requireAdmin / requireMember
├── routes/
│   ├── auth.js             # /login /register /logout
│   ├── member.js           # /members  CRUD + xem chi tiết, đăng ký gói, trừ buổi PT
│   ├── package.js          # /packages CRUD gói tập
│   ├── trainer.js          # /trainers CRUD HLV (admin only)
│   ├── product.js          # /products CRUD kho hàng
│   ├── registration.js     # /registrations POS: bán gói + sản phẩm, thanh toán
│   ├── checkin.js          # /checkin   máy quét check-in
│   ├── profile.js          # /my-profile, /profile/change-password, /profile/schedule
│   └── report.js           # /reports   doanh thu (admin only)
├── views/                  # EJS templates
├── public/                 # Static assets
├── schema.sql              # DDL cho database
├── .env.example            # Mẫu biến môi trường
└── package.json
```

## Vai trò & quyền

| Vai trò  | Trang truy cập được                                                                            |
|----------|------------------------------------------------------------------------------------------------|
| `admin`  | Báo cáo, hội viên, gói, HLV, kho, POS, check-in, đổi mật khẩu                                  |
| `staff`  | Hội viên, gói, kho, POS, check-in, đổi mật khẩu                                                |
| `member` | `/my-profile`, `/profile/schedule`, `/profile/change-password`                                 |

Login chung qua `/login` (số điện thoại + mật khẩu); hệ thống tự phân nhánh
theo `role` trong bảng `members`.

## Bảo mật đã áp dụng

- Mật khẩu lưu dưới dạng **bcrypt hash**; mật khẩu plaintext cũ được tự động
  rehash khi user đăng nhập lần đầu.
- **Helmet** thiết lập các header bảo mật cơ bản (HSTS, X-Content-Type-Options,
  X-Frame-Options…). CSP đang tắt vì template dùng nhiều CDN bên ngoài.
- **CSRF protection** dùng synchronizer-token (gói `csrf-sync`). Mọi form POST
  có hidden input `_csrf`; AJAX `fetch()` gửi token qua header `X-CSRF-Token`
  (lấy từ thẻ `<meta name="csrf-token">`).
- **Rate-limit** 10 lần/15 phút trên `POST /login`.
- Cookie session: `httpOnly: true`, `sameSite: lax`, `secure: true` khi production.
- Mọi endpoint trong `routes/registration.js` được bảo vệ bởi `requireStaff`.
- Trừ tồn kho khi thanh toán dùng `WHERE stock_quantity >= ?` để **atomic** —
  tránh trừ âm khi bán đồng thời. Toàn bộ thao tác POS được bọc trong transaction.

## Hạn chế đã biết / TODO

- Codebase còn dùng callback lồng nhiều cấp; nên refactor sang `mysql2/promise`
  + `async/await`.
- Pattern `res.send('<script>alert(...)</script>')` còn rải rác — nên thay
  bằng `connect-flash` + redirect.
- `MemoryStore` mặc định cho session: restart sẽ mất session, không scale ngang.
  Nên dùng `express-mysql-session` hoặc Redis trong production.
- Chưa có test tự động.
- Schema status (`'active'` vs `'Active'`, `'Success'`/`'Pending'`) nên chuẩn
  hóa thành ENUM/constants.
