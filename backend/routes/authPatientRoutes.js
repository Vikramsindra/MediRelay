const crypto = require("crypto");
const express = require("express");

const Patient = require("../models/PatientModel");
const { requirePatient } = require("../middleware/auth");
const { normalizeIndianPhone } = require("../utils/phone");
const { generateOTP, getExpiryDate, sendOTP } = require("../services/otpService");
const {
    issueAccessToken,
    issueTokenPair,
    patientPayload,
    verifyRefreshToken,
} = require("../services/jwtService");

const router = express.Router();

function minutesRemaining(untilDate) {
    const diffMs = new Date(untilDate).getTime() - Date.now();
    return Math.max(1, Math.ceil(diffMs / (60 * 1000)));
}

router.post("/send-otp", async (req, res) => {
    try {
        console.log("📍 [SEND-OTP] Received request:", { phone: req.body?.phone });
        const normalizedPhone = normalizeIndianPhone(req.body?.phone);
        console.log("📍 [SEND-OTP] Normalized phone:", normalizedPhone);
        if (!normalizedPhone) {
            console.log("❌ [SEND-OTP] Phone normalization failed for:", req.body?.phone);
            return res.status(400).json({ success: false, message: "Invalid Indian mobile number" });
        }

        let patient = await Patient.findOne({ phone: normalizedPhone }).select("+otp.code +otp.expiresAt +otp.attempts");
        if (!patient) {
            patient = await Patient.create({ phone: normalizedPhone });
            patient = await Patient.findById(patient._id).select("+otp.code +otp.expiresAt +otp.attempts");
        }

        const now = Date.now();
        const otpExpiryTime = patient.otp?.expiresAt ? new Date(patient.otp.expiresAt).getTime() : 0;
        const isOtpStillActive = otpExpiryTime > now;

        if (!isOtpStillActive) {
            patient.otp.attempts = 0;
        }

        if (isOtpStillActive && (patient.otp?.attempts || 0) >= 3) {
            return res.status(429).json({
                success: false,
                message: "Too many OTP requests. Please try again later.",
                retryAfterMinutes: minutesRemaining(patient.otp.expiresAt),
            });
        }

        const otp = generateOTP();
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        patient.otp = {
            code: hashedOtp,
            expiresAt: getExpiryDate(),
            attempts: (patient.otp?.attempts || 0) + 1,
        };
        await patient.save();

        await sendOTP(normalizedPhone, otp);

        const responseData = {
            phone: normalizedPhone,
            expiresAt: patient.otp.expiresAt,
        };

        if (process.env.NODE_ENV === "development") {
            responseData.devOtp = otp;
            console.log(`✅ [SEND-OTP] OTP sent successfully. Dev OTP: ${otp} for phone: ${normalizedPhone}`);
        }

        return res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error("❌ [SEND-OTP] Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/verify-otp", async (req, res) => {
    try {
        console.log("📍 [VERIFY-OTP] Received request:", { phone: req.body?.phone, otp: "***" });
        const normalizedPhone = normalizeIndianPhone(req.body?.phone);
        const otp = String(req.body?.otp || "").trim();

        if (!normalizedPhone || !otp) {
            console.log("❌ [VERIFY-OTP] Missing phone or OTP");
            return res.status(400).json({ success: false, message: "phone and otp are required" });
        }

        const patient = await Patient.findOne({ phone: normalizedPhone }).select("+otp.code +otp.expiresAt +otp.attempts +refreshToken");
        if (!patient || !patient.isActive) {
            console.log("❌ [VERIFY-OTP] Patient not found for phone:", normalizedPhone);
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        console.log("📍 [VERIFY-OTP] Validating OTP...");
        if (!patient.isOTPValid(otp)) {
            console.log("❌ [VERIFY-OTP] Invalid or expired OTP for phone:", normalizedPhone);
            return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
        }

        console.log("✅ [VERIFY-OTP] OTP valid for phone:", normalizedPhone);
        // NOTE: Do NOT clear OTP here! It needs to remain available for staff/register endpoint
        // OTP will be cleared after successful registration in authStaffRoutes.js
        
        const isNewUser = !patient.name;
        patient.isVerified = true;
        patient.lastLogin = new Date();

        const payload = patientPayload(patient);
        const { accessToken, refreshToken } = issueTokenPair(payload);
        patient.refreshToken = refreshToken;
        await patient.save();

        return res.status(200).json({
            success: true,
            data: {
                user: patient.toSafeObject(),
                accessToken,
                refreshToken,
                isNewUser,
            },
        });
    } catch (error) {
        console.error("❌ [VERIFY-OTP] Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/refresh", async (req, res) => {
    try {
        const { refreshToken } = req.body || {};
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: "refreshToken is required" });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded || decoded.userType !== "patient") {
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        const patient = await Patient.findById(decoded.sub).select("+refreshToken");
        if (!patient || !patient.isActive || patient.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        const accessToken = issueAccessToken(patientPayload(patient));
        return res.status(200).json({ success: true, data: { accessToken } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/me", requirePatient, async (req, res) => {
    try {
        const patient = await Patient.findById(req.user.sub);
        if (!patient) return res.status(404).json({ success: false, message: "Patient not found" });

        return res.status(200).json({ success: true, data: patient.toSafeObject() });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/logout", requirePatient, async (req, res) => {
    try {
        await Patient.findByIdAndUpdate(req.user.sub, { refreshToken: null, lastLogin: new Date() });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
