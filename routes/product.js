const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Xem danh sách sản phẩm (Kho hàng)
router.get('/', (req, res) => {
    db.query("SELECT * FROM products ORDER BY category ASC, stock_quantity ASC", (err, results) => {
        if (err) return res.status(500).send("Lỗi tải dữ liệu");
        res.render('products/index', { products: results || [] });
    });
});

// 2. Giao diện Thêm mới
router.get('/add', (req, res) => {
    res.render('products/add');
});

// 3. Xử lý Thêm mới
router.post('/add', (req, res) => {
    const { product_name, category, price, stock_quantity, image_url, status } = req.body;
    db.query("INSERT INTO products (product_name, category, price, stock_quantity, image_url, status) VALUES (?, ?, ?, ?, ?, ?)", 
    [product_name, category, price, stock_quantity, image_url, status], (err) => {
        if (err) return res.status(500).send("Lỗi thêm dữ liệu");
        res.redirect('/products');
    });
});

// 4. Giao diện Sửa 
router.get('/edit/:id', (req, res) => {
    db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (err, result) => {
        if (err || result.length === 0) return res.redirect('/products');
        res.render('products/edit', { product: result[0] });
    });
});

// 5. Xử lý Sửa
router.post('/edit/:id', (req, res) => {
    const { product_name, category, price, stock_quantity, image_url, status } = req.body;
    db.query("UPDATE products SET product_name=?, category=?, price=?, stock_quantity=?, image_url=?, status=? WHERE id=?", 
    [product_name, category, price, stock_quantity, image_url, status, req.params.id], (err) => {
        if (err) {
            return res.status(500).send("Lỗi cập nhật dữ liệu");}
        res.redirect('/products');
    });
});

// 6. Xóa sản phẩm
router.get('/delete/:id', (req, res) => {
    db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.send("<script>alert('Không thể xóa! Sản phẩm này đã nằm trong hóa đơn cũ.'); window.location='/products';</script>");
        res.redirect('/products');
    });
});

module.exports = router;