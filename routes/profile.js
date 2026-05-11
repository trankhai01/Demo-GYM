const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { requireLogin, requireMember } = require('../middleware/auth');
const {
    uploadAvatar,
    withFriendlyErrors,
    persistedFilePath,
    deleteUploadedFile
} = require('../middleware/upload');
const { csrfSynchronisedProtection } = require('../middleware/csrf');

const avatarUpload = withFriendlyErrors(uploadAvatar, 'avatar_file');
const avatarUploadChain = [avatarUpload, csrfSynchronisedProtection];

router.get('/my-profile', requireMember, (req, res) => {
    const memberId = req.session.user.id;
    const sqlMember = "SELECT * FROM members WHERE id = ?";
    const sqlPackage = `
        SELECT p.package_name, r.expiration_date, r.status 
        FROM registrations r
        JOIN packages p ON r.package_id = p.id
        WHERE r.member_id = ? 
        ORDER BY r.id DESC LIMIT 1
    `;

    db.query(sqlMember, [memberId], (err, memberResults) => {
        if (err || memberResults.length === 0) return res.status(500).send("Lỗi tải hồ sơ");

        db.query(sqlPackage, [memberId], (err, packageResults) => {
            if (err) return res.status(500).send("Lỗi tải gói tập");
            
            const currentPackage = packageResults.length > 0 ? packageResults[0] : null;
            res.render('my-profile', { 
                member: memberResults[0],
                activePackage: currentPackage
            });
        });
    });
});

router.post('/my-profile/edit', requireMember, ...avatarUploadChain, (req, res) => {
    const memberId = req.session.user.id;
    const {
        fullname, phone, gender,
        address, cccd, hometown,
        height, weight, birth_year, birth_date
    } = req.body;
    let resolvedBirthYear = birth_year || null;
    if (birth_date) {
        const y = Number(String(birth_date).slice(0, 4));
        if (Number.isFinite(y) && y > 1900) resolvedBirthYear = y;
    }

    if (req.uploadError) {
        return res.redirect('/my-profile?error=' + encodeURIComponent(req.uploadError));
    }

    const checkSql = "SELECT id FROM members WHERE phone = ? AND id != ?";
    db.query(checkSql, [phone, memberId], (err, results) => {
        if (err) {
            deleteUploadedFile(persistedFilePath(req, 'avatars'));
            return res.status(500).send("Lỗi hệ thống");
        }

        if (results.length > 0) {
            deleteUploadedFile(persistedFilePath(req, 'avatars'));
            return res.redirect('/my-profile?error=duplicate_phone');
        }

        db.query("SELECT avatar_url FROM members WHERE id = ?", [memberId], (eAv, rowsAv) => {
            const oldAvatar = rowsAv && rowsAv[0] ? rowsAv[0].avatar_url : null;
            const uploaded = persistedFilePath(req, 'avatars');
            const finalAvatar = uploaded || oldAvatar || null;

            const updateSql = `
                UPDATE members
                SET fullname = ?, phone = ?, gender = ?,
                    address = ?, cccd = ?, hometown = ?,
                    height = ?, weight = ?, birth_year = ?, birth_date = ?,
                    avatar_url = ?
                WHERE id = ?
            `;

            const values = [
                fullname, phone, gender,
                address || null, cccd || null, hometown || null,
                height || null, weight || null, resolvedBirthYear, birth_date || null,
                finalAvatar,
                memberId
            ];

            db.query(updateSql, values, (err) => {
                if (err) {
                    deleteUploadedFile(uploaded);
                    return res.status(500).send("Lỗi cập nhật hồ sơ");
                }
                if (uploaded && oldAvatar && oldAvatar !== uploaded) {
                    deleteUploadedFile(oldAvatar);
                }
                req.session.user.username = fullname;
                if (uploaded) req.session.user.avatar_url = uploaded;

                if (birth_date) {
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    require('../lib/birthdayJob').runForMember(memberId, { baseUrl })
                        .catch(e => console.error('[profile/edit -> birthdayJob]', e.message));
                }

                res.redirect('/my-profile?success=true');
            });
        });
    });
});

router.get('/change-password', requireLogin, (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('profile/change-password');
});

router.post('/change-password', requireLogin, (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const { old_password, new_password, confirm_password } = req.body;
    const userId = req.session.user.id; 

    if (new_password !== confirm_password) {
        return res.send('<script>alert("Mật khẩu mới không khớp!"); window.history.back();</script>');
    }
    db.query("SELECT password FROM members WHERE id = ?", [userId], async (err, results) => {
        if (err || results.length === 0) {
            return res.send('<script>alert("Lỗi hệ thống!"); window.history.back();</script>');
        }
        const dbPassword = results[0].password;
        let isMatch = false;
        if (dbPassword.startsWith('$2b$')) { 
            isMatch = await bcrypt.compare(old_password, dbPassword);
        } else {
            isMatch = (old_password === dbPassword);
        }
        
        if (!isMatch) {
            return res.send('<script>alert("Mật khẩu hiện tại không đúng!"); window.history.back();</script>');
        }
        const hashedNewPassword = await bcrypt.hash(new_password, 10);

        db.query("UPDATE members SET password = ? WHERE id = ?", [hashedNewPassword, userId], (err) => {
            if (err) return res.send('<script>alert("Lỗi cập nhật!"); window.history.back();</script>');
            
            res.send('<script>alert("Đổi mật khẩu thành công!"); window.location.href="/";</script>');
        });
    });
});

router.get('/schedule', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'member') {
        return res.redirect('/login');
    }
    const userId = req.session.user.id;
    
    // Chỉ hiện gói đã thanh toán; lịch chi tiết xem qua /schedule (bookings).
    const sqlPackage = `
        SELECT p.package_name, r.expiration_date
        FROM registrations r
        LEFT JOIN packages p ON r.package_id = p.id
        WHERE r.member_id = ? AND (r.status = 'Active' OR r.status = 'active') AND r.payment_status = 'Success'
        ORDER BY r.expiration_date DESC LIMIT 1
    `;

    const sqlHistory = `
        SELECT checkin_time, checkout_time, status, note,
               TIMESTAMPDIFF(MINUTE, checkin_time, COALESCE(checkout_time, NOW())) AS duration_min
        FROM checkin_history
        WHERE member_id = ? AND status = 'Success'
        ORDER BY checkin_time DESC LIMIT 10
    `;

    db.query(sqlPackage, [userId], (err, packageResults) => {
        if (err) return res.send('<script>alert("Lỗi hệ thống"); window.history.back();</script>');
        
        db.query(sqlHistory, [userId], (err, historyResults) => {
            if (err) return res.send('<script>alert("Lỗi hệ thống"); window.history.back();</script>');
            
            res.render('profile/schedule', { 
                regInfo: packageResults.length > 0 ? packageResults[0] : null,
                history: historyResults 
            });
        });
    });
});


module.exports = router;
