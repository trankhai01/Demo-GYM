/* GymBro UI helpers: Toast + Dark mode + Skeleton.
   Tải kèm Bootstrap 5 (đã có CDN ở header). Không phụ thuộc thư viện ngoài. */

(function () {
    'use strict';

    /* ---------------------------------------------------------------- *
     * 1. Toast — thay alert(): Toast.success / .error / .warning / .info
     * ---------------------------------------------------------------- */
    const TOAST_CONTAINER_ID = 'gym-toast-container';

    function ensureContainer() {
        let el = document.getElementById(TOAST_CONTAINER_ID);
        if (!el) {
            el = document.createElement('div');
            el.id = TOAST_CONTAINER_ID;
            el.className = 'gym-toast-container';
            document.body.appendChild(el);
        }
        return el;
    }

    function showToast(message, type, opts) {
        const container = ensureContainer();
        const t = document.createElement('div');
        t.className = 'gym-toast gym-toast-' + (type || 'info');
        const icon = ({
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        })[type] || 'bi-bell-fill';
        t.innerHTML =
            '<i class="bi ' + icon + ' gym-toast-icon"></i>' +
            '<div class="gym-toast-msg"></div>' +
            '<button class="gym-toast-close" aria-label="Close">&times;</button>';
        t.querySelector('.gym-toast-msg').textContent = String(message || '');
        const close = () => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 220);
        };
        t.querySelector('.gym-toast-close').addEventListener('click', close);
        container.appendChild(t);
        // animate in
        requestAnimationFrame(() => t.classList.add('show'));
        // auto dismiss
        const ms = (opts && opts.timeout) || 3500;
        if (ms > 0) setTimeout(close, ms);
        return t;
    }

    window.Toast = {
        success: (m, o) => showToast(m, 'success', o),
        error: (m, o) => showToast(m, 'error', o),
        warning: (m, o) => showToast(m, 'warning', o),
        info: (m, o) => showToast(m, 'info', o)
    };

    /* ---------------------------------------------------------------- *
     * 2. Confirm dialog (Promise-based, thay confirm() native)
     *    Cách dùng: const ok = await Toast.confirm("Xóa?"); if (ok) {...}
     *    Hoặc: <form data-confirm="Bạn có chắc?"> — auto intercept submit
     * ---------------------------------------------------------------- */
    function showConfirm(message, opts) {
        return new Promise((resolve) => {
            const o = opts || {};
            const overlay = document.createElement('div');
            overlay.className = 'gym-confirm-overlay show';
            overlay.innerHTML =
                '<div class="gym-confirm-dialog">' +
                  '<div class="gym-confirm-icon"><i class="bi bi-question-circle-fill"></i></div>' +
                  '<div class="gym-confirm-msg"></div>' +
                  '<div class="gym-confirm-actions">' +
                    '<button class="btn btn-light gym-confirm-cancel">Huỷ</button>' +
                    '<button class="btn btn-danger gym-confirm-ok"></button>' +
                  '</div>' +
                '</div>';
            overlay.querySelector('.gym-confirm-msg').textContent = String(message || 'Bạn có chắc chắn?');
            overlay.querySelector('.gym-confirm-ok').textContent = o.okText || 'Đồng ý';
            const cancelBtn = overlay.querySelector('.gym-confirm-cancel');
            cancelBtn.textContent = o.cancelText || 'Huỷ';
            const cleanup = (val) => {
                overlay.classList.remove('show');
                setTimeout(() => overlay.remove(), 200);
                resolve(val);
            };
            overlay.querySelector('.gym-confirm-ok').addEventListener('click', () => cleanup(true));
            cancelBtn.addEventListener('click', () => cleanup(false));
            overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });
            document.body.appendChild(overlay);
            cancelBtn.focus();
        });
    }
    window.Toast.confirm = showConfirm;

    /* Auto-attach to forms with data-confirm. Nếu form đã có onsubmit cũ
       (return confirm(...)) thì giữ nguyên — không can thiệp. */
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('form[data-confirm]');
        if (!form) return;
        if (form.dataset._confirmed === '1') return; // pass-through sau khi user OK
        e.preventDefault();
        showConfirm(form.dataset.confirm).then((ok) => {
            if (ok) {
                form.dataset._confirmed = '1';
                form.submit();
            }
        });
    });

    /* ---------------------------------------------------------------- *
     * 3. Dark mode toggle (lưu localStorage 'gym_theme')
     * ---------------------------------------------------------------- */
    const THEME_KEY = 'gym_theme';
    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    }
    function getTheme() {
        try {
            return localStorage.getItem(THEME_KEY) || 'light';
        } catch (_) { return 'light'; }
    }
    function setTheme(t) {
        try { localStorage.setItem(THEME_KEY, t); } catch (_) {}
        applyTheme(t);
        // Notify any toggle button to update icon
        document.querySelectorAll('[data-gym-theme-btn]').forEach((b) => {
            const on = (t === 'dark');
            const icon = b.querySelector('i');
            if (icon) icon.className = on ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
            b.title = on ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode';
        });
    }
    window.GymTheme = {
        get: getTheme,
        set: setTheme,
        toggle: () => setTheme(getTheme() === 'dark' ? 'light' : 'dark')
    };
    // Apply ASAP để tránh flash trắng/đen
    applyTheme(getTheme());
    // Wire up toggle button (nếu có) khi DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        setTheme(getTheme()); // refresh icon
        document.querySelectorAll('[data-gym-theme-btn]').forEach((b) => {
            b.addEventListener('click', (e) => {
                e.preventDefault();
                window.GymTheme.toggle();
            });
        });
    });
})();
