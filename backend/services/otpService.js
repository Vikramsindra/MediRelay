const crypto = require("crypto");

const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const OTP_PROVIDER = process.env.OTP_PROVIDER || "mock";

function generateOTP() {
    const max = 10 ** OTP_LENGTH;
    const min = 10 ** (OTP_LENGTH - 1);
    return String(crypto.randomInt(min, max));
}

function getExpiryDate() {
    const now = Date.now();
    return new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000);
}

async function sendViaMock(phone, otp) {
    // For local/dev testing only
    console.log(`[OTP:mock] phone=${phone}, otp=${otp} (use this OTP in app for testing)`);
    return { provider: "mock", success: true };
}

async function sendViaFast2SMS(phone, otp) {
    // TODO: replace stub with production API call and error handling.
    console.log(`[OTP:fast2sms-stub] phone=${phone}, otp=${otp}`);
    return { provider: "fast2sms", success: true };
}

async function sendOTP(phone, otp) {
    if (OTP_PROVIDER === "fast2sms") {
        return sendViaFast2SMS(phone, otp);
    }

    return sendViaMock(phone, otp);
}

module.exports = {
    generateOTP,
    getExpiryDate,
    sendOTP,
};
