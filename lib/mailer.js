const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `"GymBro" <${SMTP_USER}>` : '');

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
    return Boolean(SMTP_USER && SMTP_PASS);
}

async function sendMail({ to, subject, html, text }) {
    const tr = getTransporter();
    if (!tr) {
        console.warn('[mailer] SMTP chưa cấu hình — bỏ qua gửi mail tới', to);
        return { skipped: true };
    }
    const info = await tr.sendMail({ from: SMTP_FROM, to, subject, html, text });
    return { messageId: info.messageId };
}

function passwordResetTemplate({ fullname, tempPassword, loginUrl }) {
    const safeName = fullname || 'bạn';
    const loginLink = loginUrl || 'http://localhost:3000/login';
    const subject = 'GymBro — Mật khẩu mới của bạn';
    const text = `Xin chào ${safeName},\n\nMật khẩu mới của bạn là: ${tempPassword}\nVui lòng đăng nhập tại ${loginLink} và đổi mật khẩu ngay sau khi đăng nhập.\n\nGymBro Team`;
    const html = `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:32px;box-shadow:0 4px 12px rgba(15,23,42,.06)">
            <div style="font-family:Oswald,sans-serif;font-size:28px;font-weight:700;letter-spacing:2px;background:linear-gradient(90deg,#4f46e5,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px">GYM BRO</div>
            <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px">Mật khẩu mới của bạn</h2>
            <p style="color:#475569;line-height:1.6">Xin chào <strong>${safeName}</strong>, quản trị viên đã đặt lại mật khẩu cho tài khoản của bạn.</p>
            <div style="background:#eef2ff;border:1px dashed #4f46e5;border-radius:10px;padding:16px;text-align:center;font-size:22px;font-weight:700;letter-spacing:2px;color:#4338ca;margin:20px 0">${tempPassword}</div>
            <p style="color:#475569;line-height:1.6">Hãy đăng nhập và đổi mật khẩu ngay lập tức để đảm bảo an toàn:</p>
            <p style="text-align:center;margin:24px 0">
              <a href="${loginLink}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">Đăng nhập GymBro</a>
            </p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ phòng tập ngay.</p>
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

module.exports = { sendMail, isEnabled, passwordResetTemplate, birthdayCodeTemplate };
