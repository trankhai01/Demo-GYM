require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const { csrfSync } = require("csrf-sync");
const db = require("./config/db");

const app = express();

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set in production");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Security headers. CSP is disabled because the templates load Bootstrap,
// Bootstrap Icons, Google Fonts and audio assets from third-party CDNs;
// configuring a strict CSP for those is out of scope here.
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

const { generateToken, csrfSynchronisedProtection } = csrfSync({
  // Accept the token either from a hidden form field or an X-CSRF-Token header
  // (used by the AJAX fetch() calls in the registration POS and check-in pages).
  getTokenFromRequest: (req) => {
    if (req.body && req.body._csrf) return req.body._csrf;
    return req.headers["x-csrf-token"];
  }
});

app.use(csrfSynchronisedProtection);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.csrfToken = generateToken(req);
  next();
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
app.use("/", profileRoutes);
app.use("/reports", reportRoutes);
app.use('/trainers', require('./routes/trainer'));
app.use('/products', require('./routes/product'));
app.use('/checkin', require('./routes/checkin'));
// Profile routes are intentionally mounted under both `/` and `/profile`
// because the views link to `/my-profile`, `/profile/change-password` and
// `/profile/schedule` simultaneously.
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
