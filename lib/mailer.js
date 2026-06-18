const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `"GymBro" <${SMTP_USER}>` : '');

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'gymbro.noreply@gmail.com';
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || 'GymBro';

let transporter = null;
function getTransporter() {
    if (!SMTP_USER || !SMTP_PASS) return null;
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    return transporter;
}

function isEnabled() {
    return Boolean(BREVO_API_KEY || (SMTP_USER && SMTP_PASS));
}

async function sendMail({ to, subject, html, text }) {
    if (BREVO_API_KEY) {
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': BREVO_API_KEY,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL },
                    to: Array.isArray(to) ? to.map(e => ({ email: e })) : [{ email: to }],
                    subject,
                    htmlContent: html || undefined,
                    textContent: text || undefined
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('[Brevo Error]', data);
                throw new Error(data.message || 'Lỗi gửi email qua Brevo');
            }
            return { messageId: data.messageId };
        } catch (error) {
            console.error('[Brevo Exception]', error.message);
            throw error;
        }
    }

    // Fallback: SMTP (chỉ dùng local)
    const tr = getTransporter();
    if (!tr) {
        console.warn('[mailer] Chưa cấu hình BREVO_API_KEY hoặc SMTP — bỏ qua gửi mail tới', to);
        return { skipped: true };
    }
    const info = await tr.sendMail({ from: SMTP_FROM, to, subject, html, text });
    return { messageId: info.messageId };
}

function otpTemplate({ fullname, otpCode }) {
    const safeName = fullname || 'bạn';
    const subject = 'GymBro — Mã xác thực đặt lại mật khẩu';
    const text = `Xin chào ${safeName},\n\nMã xác thực (OTP) của bạn là: ${otpCode}\nMã này có hiệu lực trong 5 phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\nGymBro Team`;
    const html = `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:32px;box-shadow:0 4px 12px rgba(15,23,42,.06)">
            <div style="font-family:Oswald,sans-serif;font-size:28px;font-weight:700;letter-spacing:2px;background:linear-gradient(90deg,#4f46e5,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px">GYM BRO</div>
            <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px">Mã xác thực đặt lại mật khẩu</h2>
            <p style="color:#475569;line-height:1.6">Xin chào <strong>${safeName}</strong>, bạn vừa yêu cầu đặt lại mật khẩu tài khoản GymBro.</p>
            <p style="color:#475569;line-height:1.6">Mã xác thực của bạn là:</p>
            <div style="background:#eef2ff;border:1px dashed #4f46e5;border-radius:10px;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#4338ca;margin:20px 0">${otpCode}</div>
            <p style="color:#475569;line-height:1.6">Mã này có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
        </div>`;
    return { subject, text, html };
}

function birthdayCodeTemplate({ fullname, code, discountText, validTo, loginUrl }) {
    const safeName = fullname || 'bạn';
    const loginLink = loginUrl || 'http://localhost:3000/login';
    const subject = `🎂 Quà sinh nhật từ GymBro — ${discountText}`;
    const text = `Chúc mừng sinh nhật ${safeName}!\n\nGymBro tặng bạn mã ưu đãi: ${code}\nƯu đãi: ${discountText}\nHạn dùng: ${validTo}\n\nĐăng nhập: ${loginLink}`;
    const html = `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:32px;box-shadow:0 4px 12px rgba(15,23,42,.06)">
            <div style="font-family:Oswald,sans-serif;font-size:28px;font-weight:700;letter-spacing:2px;background:linear-gradient(90deg,#4f46e5,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px">GYM BRO</div>
            <h2 style="margin:0 0 12px">🎂 Chúc mừng sinh nhật, ${safeName}!</h2>
            <p style="color:#475569;line-height:1.6">GymBro gửi tặng bạn mã ưu đãi để đăng ký gói tập trong tháng sinh nhật:</p>
            <div style="background:#ecfeff;border:1px dashed #06b6d4;border-radius:10px;padding:16px;text-align:center;font-size:22px;font-weight:700;letter-spacing:2px;color:#0891b2;margin:20px 0">${code}</div>
            <p style="color:#475569"><strong>Ưu đãi:</strong> ${discountText}<br><strong>Hạn dùng:</strong> ${validTo}</p>
            <p style="text-align:center;margin:24px 0">
              <a href="${loginLink}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">Khám phá gói tập</a>
            </p>
          </div>
        </div>`;
    return { subject, text, html };
}

function registerOtpTemplate({ fullname, otpCode }) {
    const safeName = fullname || 'bạn';
    const subject = 'GymBro — Mã xác thực đăng ký tài khoản';
    const text = `Xin chào ${safeName},\n\nMã xác thực (OTP) đăng ký tài khoản của bạn là: ${otpCode}\nMã này có hiệu lực trong 5 phút.\n\nGymBro Team`;
    const html = `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:32px;box-shadow:0 4px 12px rgba(15,23,42,.06)">
            <div style="font-family:Oswald,sans-serif;font-size:28px;font-weight:700;letter-spacing:2px;background:linear-gradient(90deg,#4f46e5,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px">GYM BRO</div>
            <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px">Mã xác thực đăng ký tài khoản</h2>
            <p style="color:#475569;line-height:1.6">Xin chào <strong>${safeName}</strong>, cảm ơn bạn đã đăng ký tài khoản tại GymBro.</p>
            <p style="color:#475569;line-height:1.6">Mã xác thực của bạn là:</p>
            <div style="background:#eef2ff;border:1px dashed #4f46e5;border-radius:10px;padding:20px;text-align:center;font-size:32px;font-weight:700;letter-spacing:8px;color:#4338ca;margin:20px 0">${otpCode}</div>
            <p style="color:#475569;line-height:1.6">Mã này có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này cho bất kỳ ai.</p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>
          </div>
        </div>`;
    return { subject, text, html };
}

module.exports = { sendMail, isEnabled, otpTemplate, birthdayCodeTemplate, registerOtpTemplate };
