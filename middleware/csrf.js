// Trung tâm cấu hình csrf-sync để cả app.js và các route upload cùng dùng
// CHÍNH XÁC một secret store / token reader. Nếu khởi tạo csrfSync() ở 2 nơi
// khác nhau, mỗi instance giữ secret riêng → token sinh ra ở chỗ này không
// validate được ở chỗ kia.
//
// getTokenFromRequest:
// - req.body._csrf: form thường (urlencoded) hoặc form multipart sau khi
//   multer đã parse.
// - x-csrf-token header: dành cho fetch/XHR.
const { csrfSync } = require('csrf-sync');

const { generateToken, csrfSynchronisedProtection } = csrfSync({
    getTokenFromRequest: (req) => {
        if (req.body && req.body._csrf) return req.body._csrf;
        return req.headers['x-csrf-token'];
    }
});

module.exports = { generateToken, csrfSynchronisedProtection };
