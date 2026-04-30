const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const {
    uploadTrainerImage,
    withFriendlyErrors,
    persistedFilePath,
    deleteUploadedFile
} = require('../middleware/upload');
const { csrfSynchronisedProtection } = require('../middleware/csrf');

const trainerUpload = withFriendlyErrors(uploadTrainerImage, 'image_file');
const trainerUploadChain = [trainerUpload, csrfSynchronisedProtection];

// 1. Danh sách PT
router.get('/', requireAdmin, (req, res) => {
    db.query("SELECT * FROM trainers ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).send("Lỗi server");
        res.render('trainers/index', { trainers: results || [] });
    });
});

// 2. Giao diện Thêm
router.get('/add', requireAdmin, (req, res) => {
    res.render('trainers/add', { error: null, form: {} });
});

// 3. Xử lý Thêm — chấp nhận file upload (image_file) hoặc URL.
router.post('/add', requireAdmin, ...trainerUploadChain, (req, res) => {
    const { fullname, phone, specialty, experience_years, image_url, description } = req.body;
    if (req.uploadError) {
        return res.status(400).render('trainers/add', { error: req.uploadError, form: req.body });
    }
    const finalImage = persistedFilePath(req, 'trainers') || image_url || null;

    db.query(
        "INSERT INTO trainers (fullname, phone, specialty, experience_years, image_url, description) VALUES (?, ?, ?, ?, ?, ?)",
        [fullname, phone, specialty, experience_years, finalImage, description],
        (err) => {
            if (err) {
                deleteUploadedFile(persistedFilePath(req, 'trainers'));
                return res.status(500).send("Lỗi thêm dữ liệu");
            }
            res.redirect('/trainers');
        }
    );
});

// 4. Giao diện Sửa
router.get('/edit/:id', requireAdmin, (req, res) => {
    db.query("SELECT * FROM trainers WHERE id = ?", [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/trainers');
        res.render('trainers/edit', { trainer: result[0], error: null });
    });
});

// 5. Xử lý Sửa — file mới ưu tiên, xoá ảnh cũ trên đĩa nếu thay thế.
router.post('/edit/:id', requireAdmin, ...trainerUploadChain, (req, res) => {
    const { fullname, phone, specialty, experience_years, image_url, description, status } = req.body;
    if (req.uploadError) {
        return db.query("SELECT * FROM trainers WHERE id = ?", [req.params.id], (e, rows) => {
            const trainer = (rows && rows[0]) || { id: req.params.id };
            res.status(400).render('trainers/edit', { trainer, error: req.uploadError });
        });
    }

    db.query("SELECT image_url FROM trainers WHERE id = ?", [req.params.id], (eFind, rowsFind) => {
        const oldImage = rowsFind && rowsFind[0] ? rowsFind[0].image_url : null;
        const uploaded = persistedFilePath(req, 'trainers');
        const finalImage = uploaded || image_url || oldImage || null;

        db.query(
            "UPDATE trainers SET fullname=?, phone=?, specialty=?, experience_years=?, image_url=?, description=?, status=? WHERE id=?",
            [fullname, phone, specialty, experience_years, finalImage, description, status, req.params.id],
            (err) => {
                if (err) {
                    deleteUploadedFile(uploaded);
                    return res.status(500).send("Lỗi cập nhật dữ liệu");
                }
                if (uploaded && oldImage && oldImage !== uploaded) {
                    deleteUploadedFile(oldImage);
                }
                res.redirect('/trainers');
            }
        );
    });
});

// 6. Xóa PT — xoá luôn file ảnh nội bộ.
router.post('/delete/:id', requireAdmin, (req, res) => {
    db.query("SELECT image_url FROM trainers WHERE id = ?", [req.params.id], (eFind, rowsFind) => {
        const oldImage = rowsFind && rowsFind[0] ? rowsFind[0].image_url : null;
        db.query("DELETE FROM trainers WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.send("<script>alert('Không thể xóa PT đang có lịch dạy!'); window.location.href='/trainers';</script>");
            deleteUploadedFile(oldImage);
            res.redirect('/trainers');
        });
    });
});

module.exports = router;
