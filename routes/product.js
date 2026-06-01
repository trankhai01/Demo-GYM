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
const { normalizeProductStatus } = require('../lib/status');
const auditLog = require('../lib/auditLog');
const productUpload = withFriendlyErrors(uploadProductImage, 'image_file');
const productUploadChain = [productUpload, csrfSynchronisedProtection];

function parseProductPayload(body) {
    const productName = String(body.product_name || '').trim();
    const category = String(body.category || '').trim();
    const price = Number(body.price);
    const stockQuantity = Number(body.stock_quantity);

    if (!productName) return { error: 'Vui lòng nhập tên sản phẩm.' };
    if (!Number.isFinite(price) || price < 0) return { error: 'Giá sản phẩm không hợp lệ.' };
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) return { error: 'Số lượng tồn kho không hợp lệ.' };

    return {
        productName,
        category,
        price,
        stockQuantity,
        imageUrl: String(body.image_url || '').trim() || null,
        status: normalizeProductStatus(body.status)
    };
}

router.get('/', requireStaff, (req, res) => {
    const searchQuery = (req.query.q || '').trim();
    const selectedCategory = (req.query.category || '').trim();
    const searchSql = `%${searchQuery}%`;

    db.query(
        "SELECT category, COUNT(*) AS cnt FROM products WHERE category IS NOT NULL AND category <> '' GROUP BY category ORDER BY category ASC",
        (errCat, catRows) => {
            if (errCat) return res.status(500).send("Lỗi tải danh mục");

            db.query(
                "SELECT COUNT(*) AS total FROM products",
                (errTotal, totalRows) => {
                    if (errTotal) return res.status(500).send("Lỗi tổng sản phẩm");

                    let dataSql = "SELECT * FROM products WHERE (product_name LIKE ? OR category LIKE ?)";
                    const params = [searchSql, searchSql];
                    if (selectedCategory) {
                        dataSql += " AND category = ?";
                        params.push(selectedCategory);
                    }
                    dataSql += " ORDER BY id ASC";

                    db.query(dataSql, params, (err3, rows) => {
                        if (err3) return res.status(500).send("Lỗi tải dữ liệu");
                        res.render('products/index', {
                            products: rows || [],
                            categories: catRows || [],
                            totalProducts: totalRows[0].total || 0,
                            searchQuery,
                            selectedCategory
                        });
                    });
                }
            );
        }
    );
});

router.get('/add', requireStaff, (req, res) => {
    res.render('products/add', { error: null, form: {} });
});

router.post('/add', requireStaff, ...productUploadChain, (req, res) => {
    if (req.uploadError) {
        return res.status(400).render('products/add', { error: req.uploadError, form: req.body });
    }
    const payload = parseProductPayload(req.body);
    const uploaded = persistedFilePath(req, 'products');
    if (payload.error) {
        deleteUploadedFile(uploaded);
        return res.status(400).render('products/add', { error: payload.error, form: req.body });
    }
    const finalImage = uploaded || payload.imageUrl;

    db.query(
        "INSERT INTO products (product_name, category, price, stock_quantity, image_url, status) VALUES (?, ?, ?, ?, ?, ?)",
        [payload.productName, payload.category, payload.price, payload.stockQuantity, finalImage, payload.status],
        (err) => {
            if (err) {
                deleteUploadedFile(uploaded);
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
    if (req.uploadError) {
        return db.query("SELECT * FROM products WHERE id = ?", [req.params.id], (e, rows) => {
            const product = (rows && rows[0]) || { id: req.params.id };
            res.status(400).render('products/edit', { product, error: req.uploadError });
        });
    }

    db.query("SELECT image_url FROM products WHERE id = ?", [req.params.id], (eFind, rowsFind) => {
        const oldImage = rowsFind && rowsFind[0] ? rowsFind[0].image_url : null;
        const uploaded = persistedFilePath(req, 'products');
        const payload = parseProductPayload(req.body);
        if (payload.error) {
            deleteUploadedFile(uploaded);
            const product = {
                id: req.params.id,
                ...req.body,
                image_url: oldImage
            };
            return res.status(400).render('products/edit', { product, error: payload.error });
        }
        const finalImage = uploaded || payload.imageUrl || oldImage || null;

        db.query(
            "UPDATE products SET product_name=?, category=?, price=?, stock_quantity=?, image_url=?, status=? WHERE id=?",
            [payload.productName, payload.category, payload.price, payload.stockQuantity, finalImage, payload.status, req.params.id],
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
        const product = rowsFind && rowsFind[0] ? rowsFind[0] : null;
        const oldImage = product ? product.image_url : null;
        db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
            if (err) {
                console.error('[products/delete]', err.message);
                return res.redirect('/products?notice=delete_in_use');
            }
            deleteUploadedFile(oldImage);
            auditLog.record(req, 'product.delete', 'product', req.params.id, { image_url: oldImage });
            res.redirect('/products?notice=delete_success');
        });
    });
});

module.exports = router;
