require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session"); 
const db = require("./config/db");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback_secret_dev_only',
    resave: false,
    saveUninitialized: false, 
    cookie: {
      httpOnly: true,   
      maxAge: 1000 * 60 * 60 * 8 
    }
  }),
);


app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
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
app.use('/profile', require('./routes/profile'));

app.get('/', (req, res) => {
    db.query("SELECT * FROM packages", (err, results) => {
        res.render('home', { 
            packages: err ? [] : results,
            user: req.session ? req.session.user : null 
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server chạy tại: http://localhost:${PORT}`);
});
