const db = require('../config/db');

const DEFAULT_SETTINGS = {
    gym_name: 'GYM BRO',
    hotline: '0900 000 000',
    zalo_phone: '0900000000',
    email: 'hello@gymbro.vn',
    address: 'Quận 1, TP. Hồ Chí Minh',
    opening_hours: '05:00 - 22:00 mỗi ngày',
    map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.434088447635!2d106.6983107!3d10.776530892315796!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e9d%3A0xb8b7460491acdd84!2zUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaA!5e0!3m2!1svi!2s!4v1700000000000'
};

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(80) PRIMARY KEY,
    setting_value TEXT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let ensured = false;
let cache = null;
let cacheAt = 0;
const CACHE_TTL = 10000;

function normalizePhone(value) {
    return String(value || '').replace(/[^\d+]/g, '');
}

function viewModel(settings) {
    const out = { ...DEFAULT_SETTINGS, ...(settings || {}) };
    out.hotline_tel = normalizePhone(out.hotline);
    out.zalo_href = 'https://zalo.me/' + normalizePhone(out.zalo_phone || out.hotline);
    return out;
}

function seedDefaults(callback) {
    const rows = Object.entries(DEFAULT_SETTINGS);
    if (rows.length === 0) return callback();
    let done = 0;
    let firstErr = null;
    rows.forEach(([key, value]) => {
        db.query(
            'INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)',
            [key, value],
            (err) => {
                if (err && !firstErr) firstErr = err;
                done += 1;
                if (done === rows.length) callback(firstErr);
            }
        );
    });
}

function ensure(callback = () => {}) {
    if (ensured) return callback();
    db.query(CREATE_TABLE_SQL, (err) => {
        if (err) {
            console.error('[systemSettings.ensure]', err.message);
            return callback(err);
        }
        seedDefaults((seedErr) => {
            if (seedErr) {
                console.error('[systemSettings.seed]', seedErr.message);
                return callback(seedErr);
            }
            ensured = true;
            callback();
        });
    });
}

function load(callback) {
    if (cache && Date.now() - cacheAt < CACHE_TTL) return callback(null, cache);
    ensure((ensureErr) => {
        if (ensureErr) return callback(null, viewModel(DEFAULT_SETTINGS));
        db.query('SELECT setting_key, setting_value FROM system_settings', (err, rows) => {
            if (err) {
                console.error('[systemSettings.load]', err.message);
                return callback(null, viewModel(DEFAULT_SETTINGS));
            }
            const raw = {};
            (rows || []).forEach(row => {
                raw[row.setting_key] = row.setting_value;
            });
            cache = viewModel(raw);
            cacheAt = Date.now();
            callback(null, cache);
        });
    });
}

function updateMany(values, callback) {
    const entries = Object.keys(DEFAULT_SETTINGS).map(key => [
        key,
        values[key] == null ? '' : String(values[key]).trim()
    ]);
    let done = 0;
    let firstErr = null;
    entries.forEach(([key, value]) => {
        db.query(
            `INSERT INTO system_settings (setting_key, setting_value)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
            [key, value],
            (err) => {
                if (err && !firstErr) firstErr = err;
                done += 1;
                if (done === entries.length) {
                    cache = null;
                    callback(firstErr);
                }
            }
        );
    });
}

module.exports = { DEFAULT_SETTINGS, ensure, load, updateMany, viewModel };
