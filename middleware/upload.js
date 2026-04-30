// Helper bọc multer cho upload ảnh: products, trainers và avatar hội viên.
//
// Quy tắc chung:
// - Lưu vào thư mục public/uploads/<subdir> để Express phục vụ tĩnh.
// - Filename tự sinh từ crypto.randomBytes để tránh collision và path traversal
//   (KHÔNG bao giờ dùng req.body hoặc req.file.originalname làm filename).
// - Chỉ chấp nhận MIME image/jpeg, image/png, image/webp.
// - Giới hạn 2 MB để tránh DoS / fill ổ đĩa.
//
// Cách dùng trong route:
//   const { uploadProductImage, persistedFilePath } = require('../middleware/upload');
//   router.post('/add', requireStaff, uploadProductImage.single('image_file'), handler);
//   trong handler: const path = persistedFilePath(req, 'products');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOADS_ROOT = path.join(__dirname, '..', 'public', 'uploads');

// Map subdir -> đường dẫn tuyệt đối, đảm bảo tồn tại lúc start.
const SUBDIRS = ['products', 'trainers', 'avatars'];
SUBDIRS.forEach((d) => {
    const full = path.join(UPLOADS_ROOT, d);
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function makeStorage(subdir) {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(UPLOADS_ROOT, subdir));
        },
        filename: (req, file, cb) => {
            // 16 byte random + extension theo mime — không tin originalname.
            const rand = crypto.randomBytes(16).toString('hex');
            const ext = ALLOWED_EXT[file.mimetype] || '.bin';
            cb(null, `${rand}${ext}`);
        }
    });
}

function fileFilter(req, file, cb) {
    if (!file.mimetype) return cb(null, false);
    if (!ALLOWED_MIME.has(file.mimetype)) {
        // Đẩy lỗi để route handler hiển thị message thân thiện.
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

// Trả về đường dẫn web (`/uploads/<subdir>/<filename>`) sau khi multer đã ghi
// file. Nếu request không kèm file thì trả null.
function persistedFilePath(req, subdir) {
    if (!req.file) return null;
    return `/uploads/${subdir}/${req.file.filename}`;
}

// Middleware bọc multer.single để biến lỗi LIMIT_FILE_SIZE / INVALID_IMAGE_TYPE
// thành req.uploadError thay vì 500. Route handler tự render error.
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

// Xoá file ảnh cũ trên ổ đĩa (best-effort). Không throw nếu file không tồn tại.
function deleteUploadedFile(webPath) {
    if (!webPath || !webPath.startsWith('/uploads/')) return;
    const rel = webPath.replace(/^\/uploads\//, '');
    // Bảo vệ path traversal — sau khi resolve phải nằm trong UPLOADS_ROOT.
    const resolved = path.resolve(UPLOADS_ROOT, rel);
    if (!resolved.startsWith(UPLOADS_ROOT)) return;
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
