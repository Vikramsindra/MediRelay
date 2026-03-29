function normalizeIndianPhone(input = "") {
    const digits = String(input).replace(/\D/g, "");

    let normalized = digits;
    if (normalized.startsWith("91") && normalized.length > 10) {
        normalized = normalized.slice(2);
    }
    if (normalized.startsWith("0") && normalized.length > 10) {
        normalized = normalized.slice(1);
    }

    if (!/^[6-9]\d{9}$/.test(normalized)) {
        return null;
    }

    return normalized;
}

module.exports = {
    normalizeIndianPhone,
};
