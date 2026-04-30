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

// CSRF: bỏ qua check global cho multipart/form-data — body chưa được parse
// tại đây (multer xử lý sau, ở route-level). Các route upload PHẢI tự gọi
// csrfSynchronisedProtection SAU multer để vẫn được bảo vệ.
app.use((req, res, next) => {
  const ctype = req.headers["content-type"] || "";
  if (ctype.toLowerCase().startsWith("multipart/form-data")) return next();
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

app.get('/', (req, res) => {
    db.query("SELECT * FROM packages", (err, results) => {
        res.render('home', {
            packages: err ? [] : results,
            user: req.session ? req.session.user : null
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});
