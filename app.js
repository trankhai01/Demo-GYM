require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const db = require("./config/db");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(helmet({ contentSecurityPolicy: false }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret_dev_only",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

const { generateToken, csrfSynchronisedProtection } = require('./middleware/csrf');

// CSRF skip — CHỈ áp dụng cho các route upload đã biết, KHÔNG áp dụng cho
// mọi request multipart. Lý do: nếu skip toàn bộ multipart thì attacker có thể
// gửi multipart đến /members/delete/:id, /checkin/checkout/:id, v.v. để bypass
// CSRF cho các action không liên quan upload. Whitelist này chỉ chứa các path
// thực sự cần multer parse trước CSRF; route handler sẽ tự gắn
// csrfSynchronisedProtection SAU multer.
const CSRF_UPLOAD_SKIP_PATHS = [
  /^\/products\/add$/,
  /^\/products\/edit\/\d+$/,
  /^\/trainers\/add$/,
  /^\/trainers\/edit\/\d+$/,
  /^\/my-profile\/edit$/,
  /^\/profile\/my-profile\/edit$/, // route /profile mount cùng router
];

app.use((req, res, next) => {
  const ctype = req.headers["content-type"] || "";
  const isMultipart = ctype.toLowerCase().startsWith("multipart/form-data");
  const isUploadPath = CSRF_UPLOAD_SKIP_PATHS.some((rx) => rx.test(req.path));
  if (isMultipart && isUploadPath) return next();
  return csrfSynchronisedProtection(req, res, next);
});

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.csrfToken = generateToken(req);
  res.locals.pendingResetCount = 0;

  // Sidebar admin hiển thị badge số yêu cầu quên mật khẩu đang chờ.
  // Chỉ query cho admin + bỏ qua request asset/JSON để tiết kiệm DB.
  const u = req.session.user;
  if (u && u.role === 'admin' && req.method === 'GET' && req.accepts('html')) {
    db.query(
      "SELECT COUNT(*) AS c FROM password_reset_requests WHERE status = 'pending'",
      (err, rows) => {
        if (err) {
          console.error('[middleware] pendingResetCount:', err.message);
        } else if (rows && rows[0]) {
          res.locals.pendingResetCount = rows[0].c;
        }
        next();
      }
    );
  } else {
    next();
  }
});

const authRoutes = require("./routes/auth");
const memberRoutes = require("./routes/member");
const packageRoutes = require("./routes/package");
const registrationRoutes = require("./routes/registration");
const profileRoutes = require("./routes/profile");
const reportRoutes = require("./routes/report");

app.use("/", authRoutes);
app.use("/members", memberRoutes);
app.use("/packages", packageRoutes);
app.use("/registrations", registrationRoutes);
app.use('/schedule', require('./routes/schedule'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/admin/password-resets', require('./routes/passwordReset'));
app.use("/", profileRoutes);
app.use("/reports", reportRoutes);
app.use('/trainers', require('./routes/trainer'));
app.use('/products', require('./routes/product'));
app.use('/checkin', require('./routes/checkin'));
app.use('/profile', profileRoutes);

// Trang chủ — fetch song song packages, trainers, stats. Lỗi từng query
// không làm hỏng toàn trang: section nào fetch fail sẽ render mảng rỗng.
app.get('/', (req, res) => {
    const queries = {
        packages: "SELECT id, package_name, price, duration_months, description, pt_sessions FROM packages ORDER BY price ASC LIMIT 6",
        trainers: "SELECT id, fullname, specialty, experience_years, image_url, description FROM trainers WHERE status = 'Active' OR status IS NULL ORDER BY id ASC LIMIT 6",
        statsMembers: "SELECT COUNT(*) AS c FROM members",
        statsTrainers: "SELECT COUNT(*) AS c FROM trainers WHERE status = 'Active' OR status IS NULL",
        statsPackages: "SELECT COUNT(*) AS c FROM packages",
        statsCheckins: "SELECT COUNT(*) AS c FROM checkin_history"
    };

    const out = { packages: [], trainers: [], stats: { members: 0, trainers: 0, packages: 0, checkins: 0 } };
    const keys = Object.keys(queries);
    let done = 0;

    keys.forEach((key) => {
        db.query(queries[key], (err, rows) => {
            if (!err && rows) {
                if (key === 'packages') out.packages = rows;
                else if (key === 'trainers') out.trainers = rows;
                else if (key === 'statsMembers') out.stats.members = rows[0].c;
                else if (key === 'statsTrainers') out.stats.trainers = rows[0].c;
                else if (key === 'statsPackages') out.stats.packages = rows[0].c;
                else if (key === 'statsCheckins') out.stats.checkins = rows[0].c;
            }
            done += 1;
            if (done === keys.length) {
                res.render('home', {
                    packages: out.packages,
                    trainers: out.trainers,
                    stats: out.stats,
                    user: req.session ? req.session.user : null
                });
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});
