const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

function parseDateRange(query) {
    const preset = (query.preset || '').toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pad = n => String(n).padStart(2, '0');
    const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let from, to;
    if (preset === 'today') {
        from = to = ymd(today);
    } else if (preset === '7d') {
        const f = new Date(today); f.setDate(f.getDate() - 6);
        from = ymd(f); to = ymd(today);
    } else if (preset === '30d') {
        const f = new Date(today); f.setDate(f.getDate() - 29);
        from = ymd(f); to = ymd(today);
    } else if (preset === 'month') {
        from = ymd(new Date(today.getFullYear(), today.getMonth(), 1));
        to = ymd(today);
    } else if (preset === 'quarter') {
        const q = Math.floor(today.getMonth() / 3);
        from = ymd(new Date(today.getFullYear(), q * 3, 1));
        to = ymd(today);
    } else if (preset === 'year') {
        from = ymd(new Date(today.getFullYear(), 0, 1));
        to = ymd(today);
    } else if (query.from || query.to) {
        from = query.from || ymd(new Date(today.getFullYear(), today.getMonth(), 1));
        to = query.to || ymd(today);
    } else {
        from = ymd(new Date(today.getFullYear(), today.getMonth(), 1));
        to = ymd(today);
        return { from, to, preset: 'month' };
    }
    return { from, to, preset: preset || 'custom' };
}

function previousRange(from, to) {
    const f = new Date(from + 'T00:00:00');
    const t = new Date(to + 'T00:00:00');
    const days = Math.round((t - f) / 86400000) + 1;
    const prevTo = new Date(f); prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - days + 1);
    const pad = n => String(n).padStart(2, '0');
    const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return { from: ymd(prevFrom), to: ymd(prevTo) };
}

function buildDayLabels(from, to) {
    const out = [];
    const f = new Date(from + 'T00:00:00');
    const t = new Date(to + 'T00:00:00');
    const pad = n => String(n).padStart(2, '0');
    for (let d = new Date(f); d <= t; d.setDate(d.getDate() + 1)) {
        out.push({
            ymd: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            label: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
        });
    }
    return out;
}

function q(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

async function collectReportData({ from, to, page = 1, pageSize = 10 }) {
    const prev = previousRange(from, to);

    const [
        totalRev, prevRev,
        pkgSold, prevPkgSold,
        totalCheckins, prevCheckins,
        newMembers, prevNewMembers,
        chartDailyRev, chartCheckins,
        chartByPackage, chartPosVsPackage,
        chartTopTrainers,
        txnTotal, txnRows
    ] = await Promise.all([
        q(`SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)),0) AS v
           FROM registrations WHERE payment_status='Success' AND registration_date BETWEEN ? AND ?`, [from, to]),
        q(`SELECT COALESCE(SUM(price - COALESCE(discount_amount,0)),0) AS v
           FROM registrations WHERE payment_status='Success' AND registration_date BETWEEN ? AND ?`, [prev.from, prev.to]),
        q(`SELECT COUNT(*) AS v FROM registrations WHERE package_id IS NOT NULL AND payment_status='Success' AND registration_date BETWEEN ? AND ?`, [from, to]),
        q(`SELECT COUNT(*) AS v FROM registrations WHERE package_id IS NOT NULL AND payment_status='Success' AND registration_date BETWEEN ? AND ?`, [prev.from, prev.to]),
        q(`SELECT COUNT(*) AS v FROM checkin_history WHERE DATE(checkin_time) BETWEEN ? AND ?`, [from, to]),
        q(`SELECT COUNT(*) AS v FROM checkin_history WHERE DATE(checkin_time) BETWEEN ? AND ?`, [prev.from, prev.to]),
        q(`SELECT COUNT(*) AS v FROM members WHERE role='member' AND join_date BETWEEN ? AND ?`, [from, to]),
        q(`SELECT COUNT(*) AS v FROM members WHERE role='member' AND join_date BETWEEN ? AND ?`, [prev.from, prev.to]),

        q(`SELECT DATE_FORMAT(registration_date,'%Y-%m-%d') AS ymd,
                  COALESCE(SUM(price - COALESCE(discount_amount,0)),0) AS revenue
           FROM registrations
           WHERE payment_status='Success' AND registration_date BETWEEN ? AND ?
           GROUP BY DATE_FORMAT(registration_date,'%Y-%m-%d')
           ORDER BY ymd ASC`, [from, to]),
        q(`SELECT DATE_FORMAT(checkin_time,'%Y-%m-%d') AS ymd, COUNT(*) AS cnt
           FROM checkin_history
           WHERE DATE(checkin_time) BETWEEN ? AND ?
           GROUP BY DATE_FORMAT(checkin_time,'%Y-%m-%d')
           ORDER BY ymd ASC`, [from, to]),

        q(`SELECT p.package_name AS name,
                  COALESCE(SUM(r.price - COALESCE(r.discount_amount,0)),0) AS revenue,
                  COUNT(r.id) AS sold
           FROM registrations r
           JOIN packages p ON p.id = r.package_id
           WHERE r.payment_status='Success' AND r.registration_date BETWEEN ? AND ?
           GROUP BY p.id, p.package_name
           ORDER BY revenue DESC`, [from, to]),
        q(`SELECT
              SUM(CASE WHEN package_id IS NOT NULL THEN price - COALESCE(discount_amount,0) ELSE 0 END) AS pkg_rev,
              SUM(CASE WHEN package_id IS NULL THEN price - COALESCE(discount_amount,0) ELSE 0 END) AS pos_rev
           FROM registrations
           WHERE payment_status='Success' AND registration_date BETWEEN ? AND ?`, [from, to]),

        q(`SELECT t.fullname AS name, COUNT(*) AS sessions
           FROM pt_sessions_log s
           JOIN trainers t ON t.id = s.trainer_id
           WHERE DATE(s.created_at) BETWEEN ? AND ?
           GROUP BY t.id, t.fullname
           ORDER BY sessions DESC
           LIMIT 8`, [from, to]),

        q(`SELECT COUNT(*) AS cnt FROM registrations
           WHERE registration_date BETWEEN ? AND ?`, [from, to]),
        q(`SELECT r.id, r.registration_date, r.price, r.discount_amount, r.payment_status, r.payment_method,
                  CASE WHEN r.package_id IS NOT NULL THEN 'Gói tập' ELSE 'POS' END AS kind,
                  m.fullname AS member_name,
                  p.package_name AS package_name
           FROM registrations r
           LEFT JOIN members m ON m.id = r.member_id
           LEFT JOIN packages p ON p.id = r.package_id
           WHERE r.registration_date BETWEEN ? AND ?
           ORDER BY r.id DESC LIMIT ? OFFSET ?`, [from, to, pageSize, (page - 1) * pageSize])
    ]);

    const days = buildDayLabels(from, to);
    const revByDay = new Map(chartDailyRev.map(r => [r.ymd, Number(r.revenue) || 0]));
    const ckByDay = new Map(chartCheckins.map(r => [r.ymd, Number(r.cnt) || 0]));
    const dailyRev = days.map(d => ({ label: d.label, value: revByDay.get(d.ymd) || 0 }));
    const dailyCk = days.map(d => ({ label: d.label, value: ckByDay.get(d.ymd) || 0 }));

    const pct = (cur, prev) => {
        if (prev > 0) return ((cur - prev) / prev) * 100;
        if (cur > 0) return 100;
        return 0;
    };

    const cur = {
        revenue: Number(totalRev[0].v) || 0,
        pkgSold: Number(pkgSold[0].v) || 0,
        checkins: Number(totalCheckins[0].v) || 0,
        newMembers: Number(newMembers[0].v) || 0
    };
    const prv = {
        revenue: Number(prevRev[0].v) || 0,
        pkgSold: Number(prevPkgSold[0].v) || 0,
        checkins: Number(prevCheckins[0].v) || 0,
        newMembers: Number(prevNewMembers[0].v) || 0
    };
    const growth = {
        revenue: pct(cur.revenue, prv.revenue),
        pkgSold: pct(cur.pkgSold, prv.pkgSold),
        checkins: pct(cur.checkins, prv.checkins),
        newMembers: pct(cur.newMembers, prv.newMembers)
    };

    return {
        from, to, prev,
        cur, prv, growth,
        dailyRev, dailyCk,
        byPackage: chartByPackage.map(r => ({ name: r.name, revenue: Number(r.revenue) || 0, sold: Number(r.sold) || 0 })),
        posVsPackage: {
            pkg: Number(chartPosVsPackage[0]?.pkg_rev) || 0,
            pos: Number(chartPosVsPackage[0]?.pos_rev) || 0
        },
        topTrainers: chartTopTrainers.map(r => ({ name: r.name, sessions: Number(r.sessions) || 0 })),
        transactions: txnRows,
        txnTotal: Number(txnTotal[0].cnt) || 0,
        page, pageSize
    };
}

router.get('/', requireAdmin, async (req, res) => {
    try {
        const { from, to, preset } = parseDateRange(req.query);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const data = await collectReportData({ from, to, page });
        res.render('reports/index', { ...data, preset, csrfToken: req.csrfToken && req.csrfToken() });
    } catch (e) {
        console.error('[reports]', e);
        res.status(500).send('Lỗi tải báo cáo');
    }
});

router.get('/export/excel', requireAdmin, async (req, res) => {
    try {
        const { from, to } = parseDateRange(req.query);
        const data = await collectReportData({ from, to, page: 1, pageSize: 10000 });

        const wb = new ExcelJS.Workbook();
        wb.creator = 'GymBro';
        wb.created = new Date();

        const summary = wb.addWorksheet('Tổng quan');
        summary.columns = [
            { header: 'Chỉ số', key: 'k', width: 32 },
            { header: 'Kỳ này', key: 'cur', width: 18 },
            { header: 'Kỳ trước', key: 'prev', width: 18 },
            { header: 'Tăng trưởng (%)', key: 'g', width: 18 }
        ];
        summary.addRow({ k: 'Khoảng thời gian', cur: `${from} → ${to}`, prev: `${data.prev.from} → ${data.prev.to}`, g: '' });
        summary.addRow({ k: 'Doanh thu (VNĐ)', cur: data.cur.revenue, prev: data.prv.revenue, g: data.growth.revenue.toFixed(1) });
        summary.addRow({ k: 'Số gói tập đã bán', cur: data.cur.pkgSold, prev: data.prv.pkgSold, g: data.growth.pkgSold.toFixed(1) });
        summary.addRow({ k: 'Tổng lượt check-in', cur: data.cur.checkins, prev: data.prv.checkins, g: data.growth.checkins.toFixed(1) });
        summary.addRow({ k: 'Hội viên mới', cur: data.cur.newMembers, prev: data.prv.newMembers, g: data.growth.newMembers.toFixed(1) });
        summary.getRow(1).font = { bold: true };

        const byPkg = wb.addWorksheet('Theo gói tập');
        byPkg.columns = [
            { header: 'Gói tập', key: 'name', width: 32 },
            { header: 'Số lượng bán', key: 'sold', width: 14 },
            { header: 'Doanh thu (VNĐ)', key: 'rev', width: 18 }
        ];
        data.byPackage.forEach(p => byPkg.addRow({ name: p.name, sold: p.sold, rev: p.revenue }));
        byPkg.getRow(1).font = { bold: true };

        const txn = wb.addWorksheet('Giao dịch');
        txn.columns = [
            { header: 'Mã', key: 'id', width: 8 },
            { header: 'Ngày', key: 'date', width: 14 },
            { header: 'Hội viên', key: 'member', width: 24 },
            { header: 'Loại', key: 'kind', width: 12 },
            { header: 'Gói tập', key: 'pkg', width: 28 },
            { header: 'Giá', key: 'price', width: 14 },
            { header: 'Giảm', key: 'disc', width: 14 },
            { header: 'Thực thu', key: 'net', width: 14 },
            { header: 'Trạng thái', key: 'status', width: 12 },
            { header: 'Thanh toán', key: 'method', width: 14 }
        ];
        data.transactions.forEach(t => {
            const dateStr = t.registration_date instanceof Date
                ? t.registration_date.toLocaleDateString('vi-VN')
                : String(t.registration_date || '').slice(0, 10);
            const price = Number(t.price) || 0;
            const disc = Number(t.discount_amount) || 0;
            txn.addRow({
                id: t.id, date: dateStr, member: t.member_name || '—',
                kind: t.kind, pkg: t.package_name || '',
                price, disc, net: price - disc,
                status: t.payment_status, method: t.payment_method
            });
        });
        txn.getRow(1).font = { bold: true };

        const fname = `BaoCao_${from}_${to}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (e) {
        console.error('[reports/export/excel]', e);
        res.status(500).send('Lỗi xuất Excel');
    }
});

function findVietnameseFont() {
    const candidates = [
        path.join(__dirname, '..', 'assets', 'fonts', 'DejaVuSans.ttf'),
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/Library/Fonts/Arial Unicode.ttf',
        '/System/Library/Fonts/Supplemental/Arial Unicode.ttf',
        'C:\\Windows\\Fonts\\arial.ttf'
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}
function findVietnameseFontBold() {
    const candidates = [
        path.join(__dirname, '..', 'assets', 'fonts', 'DejaVuSans-Bold.ttf'),
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

router.get('/export/pdf', requireAdmin, async (req, res) => {
    try {
        const { from, to } = parseDateRange(req.query);
        const data = await collectReportData({ from, to, page: 1, pageSize: 200 });

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const fname = `BaoCao_${from}_${to}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
        doc.pipe(res);

        const fontPath = findVietnameseFont();
        const fontBoldPath = findVietnameseFontBold();
        if (fontPath) {
            doc.registerFont('vi', fontPath);
            doc.font('vi');
        }
        if (fontBoldPath) {
            doc.registerFont('vi-bold', fontBoldPath);
        }

        doc.fontSize(18).fillColor('#4f46e5').text('BÁO CÁO DOANH THU & HOẠT ĐỘNG', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#475569').text(`Khoảng thời gian: ${from}  →  ${to}`, { align: 'center' });
        doc.fontSize(10).fillColor('#94a3b8').text(`So sánh với kỳ trước: ${data.prev.from}  →  ${data.prev.to}`, { align: 'center' });
        doc.moveDown(1);

        const fmt = n => Number(n).toLocaleString('vi-VN');
        doc.fontSize(13).fillColor('#0f172a').text('TÓM TẮT CHỈ SỐ', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#334155');
        const rows = [
            ['Doanh thu (VNĐ)', fmt(data.cur.revenue), fmt(data.prv.revenue), `${data.growth.revenue >= 0 ? '+' : ''}${data.growth.revenue.toFixed(1)}%`],
            ['Số gói tập đã bán', String(data.cur.pkgSold), String(data.prv.pkgSold), `${data.growth.pkgSold >= 0 ? '+' : ''}${data.growth.pkgSold.toFixed(1)}%`],
            ['Tổng lượt check-in', String(data.cur.checkins), String(data.prv.checkins), `${data.growth.checkins >= 0 ? '+' : ''}${data.growth.checkins.toFixed(1)}%`],
            ['Hội viên mới', String(data.cur.newMembers), String(data.prv.newMembers), `${data.growth.newMembers >= 0 ? '+' : ''}${data.growth.newMembers.toFixed(1)}%`]
        ];
        const tableTop = doc.y;
        const colX = [40, 230, 330, 430];
        doc.fontSize(10).fillColor('#0f172a');
        ['Chỉ số', 'Kỳ này', 'Kỳ trước', 'Tăng trưởng'].forEach((h, i) => doc.text(h, colX[i], tableTop, { width: 120, continued: false }));
        doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).strokeColor('#cbd5e1').stroke();
        let y = tableTop + 22;
        rows.forEach(r => {
            r.forEach((c, i) => doc.text(String(c), colX[i], y, { width: 120 }));
            y += 18;
        });
        doc.y = y + 6;
        doc.moveDown(0.5);

        doc.fontSize(13).fillColor('#0f172a').text('DOANH THU THEO GÓI TẬP', { underline: true });
        doc.moveDown(0.5);
        if (data.byPackage.length === 0) {
            doc.fontSize(10).fillColor('#64748b').text('Không có dữ liệu.');
        } else {
            const hdr = doc.y;
            doc.fontSize(10).fillColor('#0f172a').text('Gói tập', 40, hdr).text('Đã bán', 320, hdr).text('Doanh thu (VNĐ)', 420, hdr);
            doc.moveTo(40, hdr + 14).lineTo(555, hdr + 14).strokeColor('#cbd5e1').stroke();
            let py = hdr + 20;
            data.byPackage.forEach(p => {
                doc.fontSize(10).fillColor('#334155')
                    .text(p.name, 40, py, { width: 260 })
                    .text(String(p.sold), 320, py, { width: 80 })
                    .text(fmt(p.revenue), 420, py, { width: 130 });
                py += 16;
            });
            doc.y = py + 6;
        }
        doc.moveDown(0.5);

        doc.fontSize(13).fillColor('#0f172a').text(`GIAO DỊCH CHI TIẾT (${data.transactions.length} dòng)`, { underline: true });
        doc.moveDown(0.5);
        if (data.transactions.length === 0) {
            doc.fontSize(10).fillColor('#64748b').text('Không có giao dịch trong khoảng thời gian này.');
        } else {
            const cols = [
                { k: 'id', w: 30, t: 'ID' },
                { k: 'date', w: 60, t: 'Ngày' },
                { k: 'member', w: 130, t: 'Hội viên' },
                { k: 'kind', w: 50, t: 'Loại' },
                { k: 'net', w: 90, t: 'Thực thu' },
                { k: 'status', w: 60, t: 'Trạng thái' },
                { k: 'method', w: 80, t: 'Thanh toán' }
            ];
            const startX = 40;
            const hdr = doc.y;
            let cx = startX;
            doc.fontSize(9).fillColor('#0f172a');
            cols.forEach(c => { doc.text(c.t, cx, hdr, { width: c.w }); cx += c.w; });
            doc.moveTo(40, hdr + 12).lineTo(555, hdr + 12).strokeColor('#cbd5e1').stroke();
            let ty = hdr + 18;
            data.transactions.forEach(t => {
                if (ty > 770) { doc.addPage(); ty = 60; }
                const dateStr = t.registration_date instanceof Date
                    ? t.registration_date.toLocaleDateString('vi-VN')
                    : String(t.registration_date || '').slice(0, 10);
                const net = (Number(t.price) || 0) - (Number(t.discount_amount) || 0);
                const vals = {
                    id: t.id,
                    date: dateStr,
                    member: t.member_name || '—',
                    kind: t.kind,
                    net: fmt(net),
                    status: t.payment_status,
                    method: t.payment_method || ''
                };
                cx = startX;
                doc.fontSize(9).fillColor('#334155');
                cols.forEach(c => { doc.text(String(vals[c.k] || ''), cx, ty, { width: c.w, lineBreak: false, ellipsis: true }); cx += c.w; });
                ty += 14;
            });
        }

        doc.end();
    } catch (e) {
        console.error('[reports/export/pdf]', e);
        res.status(500).send('Lỗi xuất PDF');
    }
});

module.exports = router;
