const express = require("express");

const Patient = require("../models/PatientModel");
const Staff = require("../models/StaffModel");
const { requireStaff } = require("../middleware/auth");
const { normalizeIndianPhone } = require("../utils/phone");
const {
    issueAccessToken,
    issueTokenPair,
    staffPayload,
    verifyRefreshToken,
} = require("../services/jwtService");

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            otp,
            role,
            hospitalName = null,
            specialization = null,
            phone = null,
        } = req.body || {};

        if (!name || !email || !password || !role || !phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "name, email, password, role, phone, and otp are required",
            });
        }

        const normalizedPhone = normalizeIndianPhone(phone);
        const otpCode = String(otp || "").trim();

        if (!normalizedPhone) {
            return res.status(400).json({ success: false, message: "Invalid Indian mobile number" });
        }

        if (!/^\d{6}$/.test(otpCode)) {
            return res.status(400).json({ success: false, message: "OTP must be a 6-digit code" });
        }

        console.log("📍 [REGISTER] Verifying OTP for staff registration:", { normalizedPhone, otp: "***" });
        const otpOwner = await Patient.findOne({ phone: normalizedPhone }).select("+otp.code +otp.expiresAt +otp.attempts");
        if (!otpOwner || !otpOwner.isOTPValid(otpCode)) {
            console.log("❌ [REGISTER] Invalid or expired OTP for phone:", normalizedPhone);
            return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
        }

        console.log("✅ [REGISTER] OTP valid! Clearing OTP and creating staff account...");
        otpOwner.clearOTP();
        otpOwner.isVerified = true;
        await otpOwner.save();

        const lowerEmail = String(email).trim().toLowerCase();
        const existing = await Staff.findOne({ email: lowerEmail });
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        const staff = await Staff.create({
            name: String(name).trim(),
            email: lowerEmail,
            password: String(password),
            role,
            hospitalName,
            specialization,
            phone: normalizedPhone,
        });

        const payload = staffPayload(staff);
        const { accessToken, refreshToken } = issueTokenPair(payload);

        staff.refreshToken = refreshToken;
        staff.lastLogin = new Date();
        await staff.save();

        console.log("✅ [REGISTER] Staff account created successfully for:", lowerEmail);
        return res.status(201).json({
            success: true,
            data: {
                user: staff.toSafeObject(),
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        console.error("❌ [REGISTER] Error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, phone, password } = req.body || {};
        if ((!email && !phone) || !password) {
            return res.status(400).json({ success: false, message: "email/phone and password are required" });
        }

        let query;
        if (email) {
            query = { email: String(email).trim().toLowerCase() };
        } else {
            const normalizedPhone = normalizeIndianPhone(phone);
            if (!normalizedPhone) {
                return res.status(400).json({ success: false, message: "Invalid Indian mobile number" });
            }
            query = { phone: normalizedPhone };
        }

        const staff = await Staff.findOne(query).select("+password +refreshToken");
        if (!staff || !staff.isActive) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const valid = await staff.comparePassword(password);
        if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const payload = staffPayload(staff);
        const { accessToken, refreshToken } = issueTokenPair(payload);

        staff.refreshToken = refreshToken;
        staff.lastLogin = new Date();
        await staff.save();

        return res.status(200).json({
            success: true,
            data: {
                user: staff.toSafeObject(),
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
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
        if (!decoded || decoded.userType !== "staff") {
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        const staff = await Staff.findById(decoded.sub).select("+refreshToken");
        if (!staff || !staff.isActive || staff.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: "Invalid refresh token" });
        }

        const accessToken = issueAccessToken(staffPayload(staff));
        return res.status(200).json({ success: true, data: { accessToken } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.get("/me", requireStaff, async (req, res) => {
    try {
        const staff = await Staff.findById(req.user.sub);
        if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

        return res.status(200).json({ success: true, data: staff.toSafeObject() });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

router.post("/logout", requireStaff, async (req, res) => {
    try {
        await Staff.findByIdAndUpdate(req.user.sub, { refreshToken: null, lastLogin: new Date() });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
