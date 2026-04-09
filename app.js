const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session'); // Khai báo thư viện

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'bi_mat_cua_gym',
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/member');
const packageRoutes = require('./routes/package');
const registrationRoutes = require('./routes/registration');
const profileRoutes = require('./routes/profile');
const reportRoutes = require('./routes/report');

app.use('/', authRoutes); 
app.use('/members', memberRoutes);
app.use('/packages', packageRoutes);
app.use('/registrations', registrationRoutes);
app.use('/my-profile', profileRoutes);
app.use('/reports', reportRoutes);


app.get('/', (req, res) => {
    res.render('home'); 
});
// Khởi động server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server chạy tại: http://localhost:${PORT}`);
});

