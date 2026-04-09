const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost', // Nếu không được, hãy thử thay bằng IP của XAMPP Mac
    user: 'root',
    password: '',      // Mặc định XAMPP không có mật khẩu
    database: 'quan_ly_gym'
});

connection.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL: ' + err.message);
        return;
    }
    console.log('Đã kết nối Database MySQL!');
});

module.exports = connection;