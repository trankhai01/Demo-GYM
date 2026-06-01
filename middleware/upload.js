const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOADS_ROOT = path.join(__dirname, '..', 'public', 'uploads');
const SUBDIRS = ['products', 'trainers', 'avatars'];
SUBDIRS.forEach((d) => {
    const full = path.join(UPLOADS_ROOT, d);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_BYTES = 2 * 1024 * 1024; 

function makeStorage(subdir) {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(UPLOADS_ROOT, subdir));
        },
        filename: (req, file, cb) => {
            const rand = crypto.randomBytes(16).toString('hex');
            const ext = ALLOWED_EXT[file.mimetype] || '.bin';
            cb(null, `${rand}${ext}`);
        }
    });
}

function fileFilter(req, file, cb) {
    if (!file.mimetype) return cb(null, false);
    if (!ALLOWED_MIME.has(file.mimetype)) {
        // Chuyển lỗi upload về route handler.
        return cb(new Error('INVALID_IMAGE_TYPE'), false);
    }
    cb(null, true);
}

function makeUploader(subdir) {
    return multer({
        storage: makeStorage(subdir),
        limits: { fileSize: MAX_BYTES, files: 1 },
        fileFilter
    });
}

const uploadProductImage = makeUploader('products');
const uploadTrainerImage = makeUploader('trainers');
const uploadAvatar = makeUploader('avatars');

function persistedFilePath(req, subdir) {
    if (!req.file) return null;
    return `/uploads/${subdir}/${req.file.filename}`;
}

function withFriendlyErrors(uploader, fieldName) {
    return (req, res, next) => {
        uploader.single(fieldName)(req, res, (err) => {
            if (!err) return next();
            if (err.code === 'LIMIT_FILE_SIZE') {
                req.uploadError = 'Ảnh vượt quá 2 MB. Vui lòng nén lại.';
            } else if (err.message === 'INVALID_IMAGE_TYPE') {
                req.uploadError = 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.';
            } else {
                req.uploadError = 'Không upload được ảnh. ' + (err.message || '');
            }
            next();
        });
    };
}
function deleteUploadedFile(webPath) {
    if (!webPath || !webPath.startsWith('/uploads/')) return;
    const rel = webPath.replace(/^\/uploads\//, '');
    const resolved = path.resolve(UPLOADS_ROOT, rel);
    const rootWithSep = UPLOADS_ROOT.endsWith(path.sep) ? UPLOADS_ROOT : UPLOADS_ROOT + path.sep;
    if (!resolved.startsWith(rootWithSep)) return;
    fs.unlink(resolved, () => { /* ignore ENOENT */ });
}

module.exports = {
    uploadProductImage,
    uploadTrainerImage,
    uploadAvatar,
    withFriendlyErrors,
    persistedFilePath,
    deleteUploadedFile,
    MAX_BYTES
};
