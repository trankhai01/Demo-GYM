require('dotenv').config();

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quan_ly_gym',
    waitForConnections: true,
    connectionLimit: 10
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err.message);
        return;
    }
    console.log('Đã kết nối Database MySQL!');
    connection.release();
});

module.exports = pool;