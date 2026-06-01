const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'locales');
const SUPPORTED = ['vi', 'en'];
const DEFAULT_LANG = 'vi';
const COOKIE_NAME = 'gym_lang';
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365;

const dicts = {};
function loadDict(lang) {
    if (dicts[lang]) return dicts[lang];
    try {
        const raw = fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8');
        dicts[lang] = JSON.parse(raw);
    } catch (e) {
        console.error(`[i18n] Load locale ${lang}:`, e.message);
        dicts[lang] = {};
    }
    return dicts[lang];
}

// Reload locale khi dev.
if (process.env.NODE_ENV !== 'production') {
    SUPPORTED.forEach((lang) => {
        const file = path.join(LOCALES_DIR, `${lang}.json`);
        try {
            fs.watchFile(file, { interval: 2000 }, () => {
                delete dicts[lang];
                loadDict(lang);
            });
        } catch (e) { /* ignore */ }
    });
}

function getNested(obj, key) {
    return key.split('.').reduce((acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), obj);
}

function interpolate(str, params) {
    if (!params || typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`));
}

function translate(lang, key, params) {
    const target = getNested(loadDict(lang), key);
    if (typeof target === 'string') return interpolate(target, params);
    if (lang !== DEFAULT_LANG) {
        const fb = getNested(loadDict(DEFAULT_LANG), key);
        if (typeof fb === 'string') return interpolate(fb, params);
    }
    return key;
}

function parseCookie(header) {
    const out = {};
    if (!header) return out;
    header.split(';').forEach((c) => {
        const idx = c.indexOf('=');
        if (idx < 0) return;
        const k = c.slice(0, idx).trim();
        const v = c.slice(idx + 1).trim();
        if (k) out[k] = decodeURIComponent(v);
    });
    return out;
}

function middleware(req, res, next) {
    const cookies = parseCookie(req.headers.cookie || '');
    const queryLang = (req.query && req.query.lang) ? String(req.query.lang).toLowerCase() : null;
    let lang = queryLang || cookies[COOKIE_NAME] || DEFAULT_LANG;
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;

    res.locals.lang = lang;
    res.locals.supportedLangs = SUPPORTED;
    res.locals.t = (key, params) => translate(lang, key, params);
    next();
}

// Đổi ngôn ngữ.
function setLangRoute(req, res) {
    const code = String(req.params.code || '').toLowerCase();
    const lang = SUPPORTED.includes(code) ? code : DEFAULT_LANG;
    res.cookie(COOKIE_NAME, lang, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: false,
        sameSite: 'lax',
        path: '/'
    });
    const referer = req.get('Referer') || '/';
    let back = '/';
    try {
        const parsed = new URL(referer, `${req.protocol}://${req.get('host')}`);
        const sameHost = parsed.host === req.get('host');
        if (sameHost) back = parsed.pathname + parsed.search + parsed.hash;
    } catch (e) {
        back = '/';
    }
    res.redirect(back);
}

module.exports = {
    middleware,
    setLangRoute,
    translate,
    SUPPORTED,
    DEFAULT_LANG,
    COOKIE_NAME
};
