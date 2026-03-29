const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

function issueAccessToken(payload) {
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not configured");
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function issueRefreshToken(payload) {
    if (!JWT_REFRESH_SECRET) throw new Error("JWT_REFRESH_SECRET is not configured");
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

function issueTokenPair(payload) {
    return {
        accessToken: issueAccessToken(payload),
        refreshToken: issueRefreshToken(payload),
    };
}

function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (_err) {
        return null;
    }
}

function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (_err) {
        return null;
    }
}

function staffPayload(staff) {
    return {
        sub: String(staff._id),
        role: staff.role,
        userType: "staff",
        hospitalId: staff.hospitalName || null,
        name: staff.name,
    };
}

function patientPayload(patient) {
    return {
        sub: String(patient._id),
        role: "patient",
        userType: "patient",
        phone: patient.phone,
        name: patient.name || patient.fullName || "Patient",
    };
}

module.exports = {
    issueAccessToken,
    issueRefreshToken,
    issueTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    staffPayload,
    patientPayload,
};
