function buildVietQrUrl(settings, invoice) {
    const bankBin = String(settings.bank_bin || '').trim().toLowerCase();
    const account = String(settings.bank_account || '').replace(/[^\d]/g, '');
    const accountName = String(settings.bank_account_name || settings.gym_name || 'GYM BRO').trim();
    const amount = Math.max(0, Math.round(Number(invoice.price) || 0));
    const addInfo = `GYMBRO ${invoice.id}`;

    if (!bankBin || !account || amount <= 0) return null;

    const params = new URLSearchParams({
        amount: String(amount),
        addInfo,
        accountName
    });
    return `https://img.vietqr.io/image/${bankBin}-${account}-compact2.png?${params.toString()}`;
}

module.exports = { buildVietQrUrl };
