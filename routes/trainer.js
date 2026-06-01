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
const { normalizeTrainerStatus } = require('../lib/status');
const { trainerPayload } = require('../lib/formValidation');
const auditLog = require('../lib/auditLog');

const trainerUpload = withFriendlyErrors(uploadTrainerImage, 'image_file');
const trainerUploadChain = [trainerUpload, csrfSynchronisedProtection];

router.get('/', requireAdmin, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const searchQuery = (req.query.q || '').trim();
    const limit = 10;
    const offset = (page - 1) * limit;
    const searchSql = `%${searchQuery}%`;

    const countSql = "SELECT COUNT(*) AS total FROM trainers WHERE fullname LIKE ? OR phone LIKE ? OR specialty LIKE ?";
    const dataSql = "SELECT * FROM trainers WHERE fullname LIKE ? OR phone LIKE ? OR specialty LIKE ? ORDER BY id ASC LIMIT ? OFFSET ?";

    db.query(countSql, [searchSql, searchSql, searchSql], (err, countResult) => {
        if (err) return res.status(500).send("Lỗi đếm dữ liệu");
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / limit) || 1;

        db.query(dataSql, [searchSql, searchSql, searchSql, limit, offset], (err2, rows) => {
            if (err2) return res.status(500).send("Lỗi server");
            res.render('trainers/index', {
                trainers: rows || [],
                currentPage: page,
                totalPages,
                searchQuery,
                pageOffset: offset,
                pageLimit: limit
            });
        });
    });
});

router.get('/add', requireAdmin, (req, res) => {
    res.render('trainers/add', { error: null, form: {} });
});

router.post('/add', requireAdmin, ...trainerUploadChain, (req, res) => {
    if (req.uploadError) {
        return res.status(400).render('trainers/add', { error: req.uploadError, form: req.body });
    }
    const payload = trainerPayload(req.body, normalizeTrainerStatus);
    const uploaded = persistedFilePath(req, 'trainers');
    if (payload.error) {
        deleteUploadedFile(uploaded);
        return res.status(400).render('trainers/add', { error: payload.error, form: req.body });
    }
    const finalImage = uploaded || payload.image_url || null;

    db.query(
        "INSERT INTO trainers (fullname, phone, specialty, experience_years, image_url, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [payload.fullname, payload.phone, payload.specialty, payload.experience_years, finalImage, payload.description, payload.status],
        (err) => {
            if (err) {
                deleteUploadedFile(uploaded);
                return res.status(500).send("Lỗi thêm dữ liệu");
            }
            res.redirect('/trainers');
        }
    );
});

router.get('/edit/:id', requireAdmin, (req, res) => {
    db.query("SELECT * FROM trainers WHERE id = ?", [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/trainers');
        res.render('trainers/edit', { trainer: result[0], error: null });
    });
});

router.post('/edit/:id', requireAdmin, ...trainerUploadChain, (req, res) => {
    if (req.uploadError) {
        return db.query("SELECT * FROM trainers WHERE id = ?", [req.params.id], (e, rows) => {
            const trainer = (rows && rows[0]) || { id: req.params.id };
            res.status(400).render('trainers/edit', { trainer, error: req.uploadError });
        });
    }

    db.query("SELECT image_url FROM trainers WHERE id = ?", [req.params.id], (eFind, rowsFind) => {
        const oldImage = rowsFind && rowsFind[0] ? rowsFind[0].image_url : null;
        const uploaded = persistedFilePath(req, 'trainers');
        const payload = trainerPayload(req.body, normalizeTrainerStatus);
        if (payload.error) {
            deleteUploadedFile(uploaded);
            const trainer = { id: req.params.id, ...req.body, image_url: oldImage };
            return res.status(400).render('trainers/edit', { trainer, error: payload.error });
        }
        const finalImage = uploaded || payload.image_url || oldImage || null;

        db.query(
            "UPDATE trainers SET fullname=?, phone=?, specialty=?, experience_years=?, image_url=?, description=?, status=? WHERE id=?",
            [payload.fullname, payload.phone, payload.specialty, payload.experience_years, finalImage, payload.description, payload.status, req.params.id],
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

router.post('/delete/:id', requireAdmin, (req, res) => {
    db.query("SELECT image_url FROM trainers WHERE id = ?", [req.params.id], (eFind, rowsFind) => {
        const trainer = rowsFind && rowsFind[0] ? rowsFind[0] : null;
        const oldImage = trainer ? trainer.image_url : null;
        db.query("DELETE FROM trainers WHERE id = ?", [req.params.id], (err) => {
            if (err) {
                console.error('[trainers/delete]', err.message);
                return res.redirect('/trainers?notice=delete_in_use');
            }
            deleteUploadedFile(oldImage);
            auditLog.record(req, 'trainer.delete', 'trainer', req.params.id, { image_url: oldImage });
            res.redirect('/trainers?notice=delete_success');
        });
    });
});

module.exports = router;
