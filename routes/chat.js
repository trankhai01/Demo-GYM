const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { GoogleGenAI, Type } = require('@google/genai');
const db = require('../config/db');
const { STATUS } = require('../lib/status');

const router = express.Router();

// Giới hạn request chatbot theo người dùng.
const chatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => (req.session.user && req.session.user.id) ? `u${req.session.user.id}` : ipKeyGenerator(req, res),
    message: { ok: false, reply: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau vài phút.' }
});

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEN_CONFIG = { temperature: 0.4, maxOutputTokens: 600 };

// Snapshot dữ liệu cho chatbot.
function fetchPublicContext() {
    return new Promise((resolve) => {
        const out = { packages: [], trainers: [] };
        let done = 0;
        db.query("SELECT id, package_name, price, duration_months, pt_sessions, description FROM packages ORDER BY price ASC LIMIT 20", (err, rows) => {
            if (!err && rows) out.packages = rows;
            if (++done === 2) resolve(out);
        });
        db.query("SELECT id, fullname, specialty, experience_years FROM trainers WHERE status = ? OR status IS NULL ORDER BY id ASC LIMIT 20", [STATUS.TRAINER.ACTIVE], (err, rows) => {
            if (!err && rows) out.trainers = rows;
            if (++done === 2) resolve(out);
        });
    });
}


const FAQ = [
    { q: 'Giờ mở cửa', a: 'Phòng tập mở cửa từ 5h sáng đến 22h hàng ngày, cả thứ 7 và chủ nhật.' },
    { q: 'Cách đặt lịch tập', a: 'Đăng nhập → vào mục "Lịch tập" trên sidebar → chọn ô giờ trống → chọn HLV (nếu muốn) → đặt buổi.' },
    { q: 'Quên mật khẩu', a: 'Tại trang Đăng nhập có link "Quên mật khẩu?". Nhập số điện thoại đã đăng ký và đợi quản trị viên reset.' },
    { q: 'Hủy buổi tập', a: 'Vào lịch tập, click vào buổi đã đặt, bấm nút "Hủy buổi". Có thể hủy đến trước giờ tập.' },
    { q: 'Đăng ký gói tập', a: 'Hội viên có thể tự đăng ký hoặc nâng cấp gói tập trực tiếp trên trang cá nhân (Dashboard) và thanh toán bằng cách quét mã QR chuyển khoản payOS. Mỗi hội viên chỉ duy trì 1 gói tập đang hoạt động tại 1 thời điểm.' },
    { q: 'Cách check-in', a: 'Quét mã hoặc nhập số điện thoại tại quầy lễ tân. Hệ thống tự động ghi nhận giờ vào và giờ ra.' }
];


const FAQ_EN = [
    { q: 'Opening hours', a: 'The gym is open from 5am to 10pm every day, including weekends.' },
    { q: 'How to book a session', a: 'Sign in → click "Schedule" in the sidebar → pick an empty slot → choose a trainer (optional) → confirm.' },
    { q: 'Forgot password', a: 'On the Sign-in page click "Forgot password?". Enter your registered phone and wait for the admin to reset it.' },
    { q: 'Cancel a session', a: 'Open the schedule, click on a booked session, and press "Cancel". You can cancel anytime before the session starts.' },
    { q: 'Sign up for a package', a: 'Members can self-register or upgrade their package directly on their Dashboard and pay securely via payOS QR transfer. Each member keeps only one active package at a time.' },
    { q: 'How to check in', a: 'Scan the QR or enter your phone at the front desk. The system records check-in/out automatically.' }
];

function buildSystemPromptEn(ctx, user) {
    const pkgList = ctx.packages.map(p => {
        const pt = p.pt_sessions > 0 ? ` (${p.pt_sessions} PT sessions)` : '';
        return `- ${p.package_name}: ${Number(p.price).toLocaleString('en-US')} VND / ${p.duration_months} month(s)${pt}`;
    }).join('\n') || '(no packages yet)';

    const trainerList = ctx.trainers.map(t => {
        const exp = t.experience_years ? `, ${t.experience_years} yrs exp` : '';
        const spec = t.specialty ? `, ${t.specialty}` : '';
        return `- ${t.fullname}${spec}${exp}`;
    }).join('\n') || '(no trainers yet)';

    const faqList = FAQ_EN.map(f => `- ${f.q}: ${f.a}`).join('\n');
    const displayName = user ? (user.username || user.fullname || 'member') : null;
    const userInfo = user
        ? (user.role === 'member'
            ? `\nUser chatting: ${displayName} (role: member). You may call tools to query their personal data when relevant.`
            : `\nUser chatting: ${displayName} (role: ${user.role}). No personal-data tool available — only general gym info.`)
        : `\nUser is a guest (not signed in). No personal-data tool — invite them to sign in if they want their package / schedule / check-in.`;

    return `You are "GymBro Assistant" — virtual assistant of GymBro gym. ALWAYS reply in English, friendly and CONCISE (max 4-5 sentences, or bullet points when helpful).

MISSION:
- Advise on packages, trainers, and how to use the system.
- Answer common FAQ questions.
- When user is signed in as member, you may call tools to view their current package / upcoming bookings / check-in history.

RULES:
- DO NOT make things up. If unsure, ask them to contact the front desk.
- DO NOT answer off-topic questions (politics, programming, etc.).
- DO NOT promise discounts or promotions that don't exist.
- Reply in English. Money format: append " VND" after the number, e.g. 500,000 VND.

CURRENT PACKAGES:
${pkgList}

ACTIVE TRAINERS:
${trainerList}

FAQ:
${faqList}
${userInfo}`;
}

function buildSystemPrompt(ctx, user, lang) {
    if (lang === 'en') return buildSystemPromptEn(ctx, user);
    const pkgList = ctx.packages.map(p => {
        const pt = p.pt_sessions > 0 ? ` (${p.pt_sessions} buổi PT)` : '';
        return `- ${p.package_name}: ${Number(p.price).toLocaleString('vi-VN')}đ / ${p.duration_months} tháng${pt}`;
    }).join('\n') || '(chưa có gói nào)';

    const trainerList = ctx.trainers.map(t => {
        const exp = t.experience_years ? `, ${t.experience_years} năm KN` : '';
        const spec = t.specialty ? `, ${t.specialty}` : '';
        return `- ${t.fullname}${spec}${exp}`;
    }).join('\n') || '(chưa có HLV nào)';

    const faqList = FAQ.map(f => `- ${f.q}: ${f.a}`).join('\n');
    const displayName = user ? (user.username || user.fullname || 'thành viên') : null;
    const userInfo = user
        ? (user.role === 'member'
            ? `\nNgười đang chat: ${displayName} (vai trò: member). Có thể gọi tool để truy vấn dữ liệu cá nhân của họ khi liên quan.`
            : `\nNgười đang chat: ${displayName} (vai trò: ${user.role}). Không có tool truy vấn dữ liệu cá nhân — chỉ tư vấn thông tin chung về phòng gym.`)
        : `\nNgười đang chat là khách (chưa đăng nhập). Không thể truy vấn dữ liệu cá nhân — gợi ý họ đăng nhập nếu cần xem gói hiện tại / lịch tập / check-in.`;

    return `Bạn là "GymBro Trợ lý" — trợ lý ảo của phòng tập GymBro, trả lời bằng tiếng Việt thân thiện và NGẮN GỌN (tối đa 4-5 câu, hoặc dạng bullet nếu phù hợp).

NHIỆM VỤ:
- Tư vấn gói tập, HLV, hướng dẫn sử dụng hệ thống.
- Trả lời các câu hỏi thường gặp (FAQ).
- Khi người dùng đã đăng nhập làm member, có thể gọi tool để xem gói hiện tại / buổi tập sắp tới / lịch sử check-in của họ.

QUY TẮC:
- KHÔNG bịa thông tin. Nếu không biết → bảo họ liên hệ lễ tân.
- KHÔNG trả lời câu hỏi ngoài chủ đề phòng gym (chính trị, code, v.v.).
- KHÔNG hứa giảm giá, ưu đãi không có thật.
- Trả lời bằng tiếng Việt. Định dạng tiền: dùng "đ" cuối số. Ví dụ: 500.000đ.

DANH SÁCH GÓI TẬP HIỆN TẠI:
${pkgList}

DANH SÁCH HLV ĐANG HOẠT ĐỘNG:
${trainerList}

CÂU HỎI THƯỜNG GẶP (FAQ):
${faqList}
${userInfo}`;
}

const memberTools = [
    {
        name: 'get_my_active_package',
        description: 'Lấy gói tập đang hoạt động của member hiện tại (tên gói, ngày hết hạn, số buổi PT đã/còn).',
        parameters: { type: Type.OBJECT, properties: {}, required: [] }
    },
    {
        name: 'get_upcoming_bookings',
        description: 'Lấy 5 buổi tập sắp tới đã đặt (giờ bắt đầu, HLV, ghi chú).',
        parameters: { type: Type.OBJECT, properties: {}, required: [] }
    },
    {
        name: 'get_recent_checkins',
        description: 'Lấy 10 lần check-in gần nhất (giờ vào, giờ ra, thời lượng).',
        parameters: { type: Type.OBJECT, properties: {}, required: [] }
    }
];

function runMemberTool(name, memberId) {
    return new Promise((resolve) => {
        if (name === 'get_my_active_package') {
            db.query(`
                SELECT p.package_name, r.expiration_date, r.total_sessions, r.used_sessions,
                       DATEDIFF(r.expiration_date, CURRENT_DATE()) AS days_left
                FROM registrations r LEFT JOIN packages p ON r.package_id = p.id
                WHERE r.member_id = ? AND r.status = ? AND r.payment_status = ?
                  AND (r.expiration_date IS NULL OR r.expiration_date >= CURRENT_DATE())
                ORDER BY r.expiration_date DESC LIMIT 1
            `, [memberId, STATUS.REGISTRATION.ACTIVE, STATUS.PAYMENT.SUCCESS], (err, rows) => {
                if (err || !rows || rows.length === 0) return resolve({ has_package: false });
                const r = rows[0];
                resolve({
                    has_package: true,
                    package_name: r.package_name,
                    expiration_date: r.expiration_date,
                    days_left: r.days_left,
                    pt_sessions_total: r.total_sessions || 0,
                    pt_sessions_used: r.used_sessions || 0,
                    pt_sessions_remaining: Math.max(0, (r.total_sessions || 0) - (r.used_sessions || 0))
                });
            });
        } else if (name === 'get_upcoming_bookings') {
            db.query(`
                SELECT b.start_time, b.end_time, b.title, b.note, t.fullname AS trainer_name
                FROM bookings b LEFT JOIN trainers t ON b.trainer_id = t.id
                WHERE b.member_id = ? AND b.status = ? AND b.end_time >= NOW()
                ORDER BY b.start_time ASC LIMIT 5
            `, [memberId, STATUS.BOOKING.BOOKED], (err, rows) => {
                if (err) return resolve({ bookings: [] });
                resolve({ bookings: rows || [] });
            });
        } else if (name === 'get_recent_checkins') {
            db.query(`
                SELECT checkin_time, checkout_time,
                       TIMESTAMPDIFF(MINUTE, checkin_time, COALESCE(checkout_time, NOW())) AS duration_min
                FROM checkin_history WHERE member_id = ?
                ORDER BY checkin_time DESC LIMIT 10
            `, [memberId], (err, rows) => {
                if (err) return resolve({ checkins: [] });
                resolve({ checkins: rows || [] });
            });
        } else {
            resolve({ error: 'Unknown tool' });
        }
    });
}

router.post('/api/chat', chatLimiter, async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ ok: false, reply: 'Chatbot chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
    }

    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ ok: false, reply: 'Tin nhắn rỗng.' });
    }
    if (message.length > 1000) {
        return res.status(400).json({ ok: false, reply: 'Tin nhắn quá dài (giới hạn 1000 ký tự).' });
    }

    const user = req.session.user || null;
    const isMember = !!(user && user.role === 'member' && user.id);

    const lang = (res.locals && res.locals.lang) || 'vi';

    try {
        const ctx = await fetchPublicContext();
        const systemInstruction = buildSystemPrompt(ctx, user, lang);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const contents = [];
        if (Array.isArray(history)) {
            history.slice(-12).forEach(h => {
                if (h && typeof h.role === 'string' && typeof h.text === 'string' && h.text.length < 2000) {
                    const role = h.role === 'user' ? 'user' : 'model';
                    contents.push({ role, parts: [{ text: h.text }] });
                }
            });
        }
        contents.push({ role: 'user', parts: [{ text: message.trim() }] });

        const config = {
            systemInstruction,
            ...GEN_CONFIG,
            ...(isMember ? { tools: [{ functionDeclarations: memberTools }] } : {})
        };

        let response = await ai.models.generateContent({ model: MODEL, contents, config });
        for (let hop = 0; hop < 3; hop++) {
            const calls = response.functionCalls || [];
            if (calls.length === 0) break;

            const toolResponses = [];
            for (const call of calls) {
                const result = isMember ? await runMemberTool(call.name, user.id) : { error: 'Login required' };
                toolResponses.push({ functionResponse: { name: call.name, response: { result } } });
            }
            if (response.candidates && response.candidates[0] && response.candidates[0].content) {
                contents.push(response.candidates[0].content);
            }
            contents.push({ role: 'user', parts: toolResponses });
            response = await ai.models.generateContent({ model: MODEL, contents, config });
        }

        const reply = (response.text || '').trim() || 'Xin lỗi, mình chưa rõ ý. Bạn nói rõ hơn được không?';
        return res.json({ ok: true, reply });
    } catch (err) {
        console.error('[chat] Gemini error:', err.message || err);
        return res.status(502).json({
            ok: false,
            reply: 'Hiện trợ lý đang bận. Bạn thử lại sau vài giây nhé, hoặc liên hệ lễ tân để được hỗ trợ trực tiếp.'
        });
    }
});

module.exports = router;
