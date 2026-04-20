const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password: '',     
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