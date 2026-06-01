function text(value, maxLength, fallback = '') {
    const out = String(value || '').trim();
    return out ? out.slice(0, maxLength) : fallback;
}

function optionalText(value, maxLength) {
    const out = text(value, maxLength);
    return out || null;
}

function phone(value) {
    const raw = String(value || '').trim();
    const compact = raw.replace(/[\s().-]/g, '');
    if (!/^\+?\d{8,15}$/.test(compact)) {
        return { error: 'Số điện thoại không hợp lệ.' };
    }
    return { value: compact };
}

function email(value) {
    const out = String(value || '').trim().toLowerCase();
    if (!out) return { value: null };
    if (out.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out)) {
        return { error: 'Email không hợp lệ.' };
    }
    return { value: out };
}

function gender(value) {
    return ['Nam', 'Nữ', 'Khác'].includes(value) ? value : 'Nam';
}

function optionalNumber(value, { min, max, decimals = 2 }) {
    if (value === '' || value == null) return { value: null };
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) {
        return { error: 'Giá trị số không hợp lệ.' };
    }
    return { value: Number(n.toFixed(decimals)) };
}

function optionalInteger(value, { min, max }) {
    if (value === '' || value == null) return { value: null };
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) {
        return { error: 'Giá trị số nguyên không hợp lệ.' };
    }
    return { value: n };
}

function dateOnly(value) {
    if (!value) return { value: null };
    const raw = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { error: 'Ngày không hợp lệ.' };
    const [year, month, day] = raw.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    if (
        Number.isNaN(d.getTime())
        || d.getFullYear() !== year
        || d.getMonth() !== month - 1
        || d.getDate() !== day
    ) {
        return { error: 'Ngày không hợp lệ.' };
    }
    return { value: raw };
}

function memberPayload(body, options = {}) {
    const fullname = text(body.fullname, 100);
    if (!fullname) return { error: 'Vui lòng nhập họ tên.' };

    const phoneResult = phone(body.phone);
    if (phoneResult.error) return phoneResult;

    const emailResult = email(body.email);
    if (emailResult.error) return emailResult;

    const birthDateResult = dateOnly(body.birth_date);
    if (birthDateResult.error) return birthDateResult;

    const birthYearResult = optionalInteger(body.birth_year, { min: 1900, max: new Date().getFullYear() });
    if (birthYearResult.error) return { error: 'Năm sinh không hợp lệ.' };

    let birthYear = birthYearResult.value;
    if (birthDateResult.value) birthYear = Number(birthDateResult.value.slice(0, 4));

    const heightResult = optionalNumber(body.height, { min: 50, max: 250, decimals: 1 });
    if (heightResult.error) return { error: 'Chiều cao không hợp lệ.' };
    const weightResult = optionalNumber(body.weight, { min: 20, max: 300, decimals: 1 });
    if (weightResult.error) return { error: 'Cân nặng không hợp lệ.' };

    return {
        fullname,
        phone: phoneResult.value,
        email: emailResult.value,
        gender: gender(body.gender),
        cccd: optionalText(body.cccd, 20),
        birth_year: birthYear,
        birth_date: birthDateResult.value,
        height: heightResult.value,
        weight: weightResult.value,
        hometown: optionalText(body.hometown, 100),
        address: optionalText(body.address, 255),
        role: options.role || 'member'
    };
}

function trainerPayload(body, normalizeStatus) {
    const fullname = text(body.fullname, 100);
    if (!fullname) return { error: 'Vui lòng nhập họ tên HLV.' };
    const phoneResult = phone(body.phone);
    if (phoneResult.error) return phoneResult;
    const expResult = optionalInteger(body.experience_years || 0, { min: 0, max: 80 });
    if (expResult.error) return { error: 'Số năm kinh nghiệm không hợp lệ.' };

    return {
        fullname,
        phone: phoneResult.value,
        specialty: optionalText(body.specialty, 100),
        experience_years: expResult.value || 0,
        image_url: optionalText(body.image_url, 500),
        description: optionalText(body.description, 2000),
        status: normalizeStatus(body.status)
    };
}

module.exports = {
    memberPayload,
    trainerPayload,
    text,
    optionalText,
    phone,
    email,
    gender,
    optionalNumber,
    optionalInteger,
    dateOnly
};
