const db = require('../config/db');

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id INT NULL,
    actor_name VARCHAR(100) NULL,
    actor_role VARCHAR(20) NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NULL,
    metadata JSON NULL,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_actor_time (actor_id, created_at),
    INDEX idx_audit_entity_time (entity_type, entity_id, created_at),
    INDEX idx_audit_action_time (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let ensured = false;

function ensure(callback = () => {}) {
    if (ensured) return callback();
    db.query(CREATE_TABLE_SQL, (err) => {
        if (err) {
            console.error('[auditLog.ensure]', err.message);
            return callback(err);
        }
        ensured = true;
        callback();
    });
}

function insert(req, entry) {
    const user = req && req.session ? req.session.user : null;
    const metadata = entry.metadata == null ? null : JSON.stringify(entry.metadata);
    db.query(
        `INSERT INTO audit_logs
         (actor_id, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user ? user.id : null,
            user ? user.username : null,
            user ? user.role : null,
            entry.action,
            entry.entityType,
            entry.entityId == null ? null : String(entry.entityId),
            metadata,
            req ? req.ip : null,
            req && req.get ? String(req.get('user-agent') || '').slice(0, 255) : null
        ],
        (err) => {
            if (!err) return;
            if (err.code === 'ER_NO_SUCH_TABLE') {
                return ensure((ensureErr) => {
                    if (!ensureErr) insert(req, entry);
                });
            }
            console.error('[auditLog.record]', err.message);
        }
    );
}

function record(req, action, entityType, entityId, metadata = null) {
    if (!action || !entityType) return;
    insert(req, { action, entityType, entityId, metadata });
}

module.exports = { ensure, record };
