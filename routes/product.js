const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireStaff } = require('../middleware/auth');
const {
    uploadProductImage,
    withFriendlyErrors,
    persistedFilePath,
    deleteUploadedFile
} = require('../middleware/upload');
const { csrfSynchronisedProtection } = require('../middleware/csrf');
const productUpload = withFriendlyErrors(uploadProductImage, 'image_file');
const productUploadChain = [productUpload, csrfSynchronisedProtection];

router.get('/', requireStaff, (req, res) => {
    db.query("SELECT * FROM products ORDER BY category ASC, stock_quantity ASC", (err, results) => {
        if (err) return res.status(500).send("Lỗi tải dữ liệu");
        res.render('products/index', { products: results || [] });
    });
});

router.get('/add', requireStaff, (req, res) => {
    res.render('products/add', { error: null, form: {} });
});

router.post('/add', requireStaff, ...productUploadChain, (req, res) => {
    const { product_name, category, price, stock_quantity, image_url, status } = req.body;
    if (req.uploadError) {
        return res.status(400).render('products/add', { error: req.uploadError, form: req.body });
    }
    const finalImage = persistedFilePath(req, 'products') || image_url || null;

    db.query(
        "INSERT INTO products (product_name, category, price, stock_quantity, image_url, status) VALUES (?, ?, ?, ?, ?, ?)",
        [product_name, category, price, stock_quantity, finalImage, status],
        (err) => {
            if (err) {
                deleteUploadedFile(persistedFilePath(req, 'products'));
                return res.status(500).send("Lỗi thêm dữ liệu");
            }
            res.redirect('/products');
        }
    );
});

router.get('/edit/:id', requireStaff, (req, res) => {
    db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/products');
        res.render('products/edit', { product: result[0], error: null });
    });
});

router.post('/edit/:id', requireStaff, ...productUploadChain, (req, res) => {
    const { product_name, category, price, stock_quantity, image_url, status } = req.body;
    if (req.uploadError) {
        return db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (e, rows) => {
            const product = (rows && rows[0]) || { id: req.params.id };
            res.status(400).render('products/edit', { product, error: req.uploadError });
        });
    }

    db.query("SELECT image_url FROM products WHERE id = ?", [req.params.id], (eFind, rowsFind) => {
        const oldImage = rowsFind && rowsFind[0] ? rowsFind[0].image_url : null;
        const uploaded = persistedFilePath(req, 'products');
        const finalImage = uploaded || image_url || oldImage || null;

        db.query(
            "UPDATE products SET product_name=?, category=?, price=?, stock_quantity=?, image_url=?, status=? WHERE id=?",
            [product_name, category, price, stock_quantity, finalImage, status, req.params.id],
            (err) => {
                if (err) {
                    deleteUploadedFile(uploaded);
                    return res.status(500).send("Lỗi cập nhật dữ liệu");
                }
                if (uploaded && oldImage && oldImage !== uploaded) {
                    deleteUploadedFile(oldImage);
                }
                res.redirect('/products');
            }
        );
    });
});

router.post('/delete/:id', requireStaff, (req, res) => {
    db.query("SELECT image_url FROM products WHERE id = ?", [req.params.id], (eFind, rowsFind) => {
        const oldImage = rowsFind && rowsFind[0] ? rowsFind[0].image_url : null;
        db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.send("<script>alert('Không thể xóa! Sản phẩm này đã nằm trong hóa đơn cũ.'); window.location.href='/products';</script>");
            deleteUploadedFile(oldImage);
            res.redirect('/products');
        });
    });
});

module.exports = router;
