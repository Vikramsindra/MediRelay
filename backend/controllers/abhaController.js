// ─── ALL IMPORTS ────────────────────────────────────────────────────────────
const User = require("../models/UserModel");
const Patient = require("../models/PatientModel");
const generateToken = require("../utils/generateToken");

// Switch between mock (dummy OTP) and real ABDM service via .env
const {
    generateMobileOTP,
    verifyMobileOTP,
    getABHAProfile,
    searchByABHAId,
} = process.env.USE_MOCK === "true"
        ? require("../services/mockAbhaService")
        : require("../utils/abhaService");


// In-memory transaction store — maps txnId → { mobile, expiresAt }
// Replace with Redis in production for multi-instance deployments
const txnStore = new Map();

// ═══════════════════════════════════════════════════════════
//  FLOW: Patient login / registration via ABHA mobile OTP
//
//  Step 1:  POST /api/auth/abha/send-otp    → { txnId }
//  Step 2:  POST /api/auth/abha/verify-otp  → { token, user, patient }
// ═══════════════════════════════════════════════════════════

/**
 * Step 1 — Send OTP to patient's ABDM-registered mobile number.
 * Body: { mobile: "9876543210" }
 */
exports.sendOTP = async (req, res) => {
    try {
        const { mobile } = req.body;

        if (!mobile || !/^\d{10}$/.test(mobile)) {
            return res.status(400).json({
                success: false,
                message: "Valid 10-digit mobile number is required",
            });
        }

        const data = await generateMobileOTP(mobile);
        // data = { txnId: "...", message: "OTP sent" }

        // Cache txnId so we can validate it in step 2
        txnStore.set(data.txnId, {
            mobile,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        res.json({
            success: true,
            txnId: data.txnId,
            message: "OTP sent to your ABDM-registered mobile number",
        });

    } catch (err) {
        console.error("sendOTP error:", err.response?.data || err.message);
        res.status(502).json({
            success: false,
            message: "Failed to send OTP. Check your ABDM sandbox credentials.",
            detail: err.response?.data,
        });
    }
};

/**
 * Step 2 — Verify OTP, fetch ABHA profile, find/create User + Patient.
 * Body: { txnId: "...", otp: "123456" }
 * Returns: { token, user, patient }
 */
exports.verifyOTP = async (req, res) => {
    try {
        const { txnId, otp } = req.body;

        if (!txnId || !otp) {
            return res.status(400).json({
                success: false,
                message: "txnId and otp are required",
            });
        }

        // Check transaction is still valid
        const txn = txnStore.get(txnId);
        if (!txn || Date.now() > txn.expiresAt) {
            txnStore.delete(txnId);
            return res.status(400).json({
                success: false,
                message: "OTP expired or invalid. Please request a new one.",
            });
        }

        // 1️⃣ Verify OTP with ABDM → get a short-lived ABDM user token
        const { token: abdmUserToken } = await verifyMobileOTP(txnId, otp);

        // 2️⃣ Use ABDM token to fetch full ABHA profile
        const profile = await getABHAProfile(abdmUserToken);
        /*
          profile = {
            healthIdNumber: "91-1234-5678-9012",   ← the 14-digit ABHA number
            healthId:       "ravi@abdm",            ← ABHA address
            name:           "Ravi Kumar",
            yearOfBirth:    "1985",
            gender:         "M",
            mobile:         "9876543210",
            email:          "ravi@example.com",
            ...
          }
        */

        txnStore.delete(txnId); // clean up

        // 3️⃣ Find or create User account (role = patient)
        let user = await User.findOne({ abhaId: profile.healthIdNumber });

        if (!user) {
            user = await User.create({
                name: profile.name,
                role: "patient",
                abhaId: profile.healthIdNumber,
                phone: profile.mobile,
                email: profile.email || `${profile.healthIdNumber.replace(/-/g, "")}@abha.in`,
                // No password — ABHA users authenticate via OTP only
                password: "ABHA_NO_PASSWORD", // non-empty to pass schema validation
                isActive: true,
            });
        }

        // 4️⃣ Find or create Patient profile (clinical record)
        let patient = await Patient.findOne({ abhaId: profile.healthIdNumber });

        if (!patient) {
            patient = await Patient.create({
                fullName: profile.name,
                abhaId: profile.healthIdNumber,
                abhaAddress: profile.healthId,
                phone: profile.mobile,
                gender:
                    profile.gender === "M" ? "male" :
                        profile.gender === "F" ? "female" : "other",
                dateOfBirth: profile.yearOfBirth
                    ? new Date(`${profile.yearOfBirth}-01-01`)
                    : undefined,
                userId: user._id,
                abhaVerified: true,
                abhaVerifiedAt: new Date(),
            });
        } else {
            // Refresh any updated ABDM data
            patient.abhaAddress = profile.healthId;
            patient.userId = user._id;
            patient.abhaVerified = true;
            patient.abhaVerifiedAt = new Date();
            await patient.save();
        }

        // 5️⃣ Issue your app's JWT
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
                abhaId: user.abhaId,
                phone: user.phone,
            },
            patient,
        });

    } catch (err) {
        console.error("verifyOTP error:", err.response?.data || err.message);
        res.status(502).json({
            success: false,
            message: "OTP verification failed",
            detail: err.response?.data,
        });
    }
};

// ═══════════════════════════════════════════════════════════
//  Doctor utility: fetch patient by ABHA ID while creating transfer
//  GET /api/auth/abha/patient/:abhaId   (doctor only)
// ═══════════════════════════════════════════════════════════
exports.fetchPatientByABHA = async (req, res) => {
    try {
        const { abhaId } = req.params;

        // 1️⃣ Check local DB first (fast path)
        const localPatient = await Patient.findOne({ abhaId });
        if (localPatient) {
            return res.json({ success: true, source: "local", data: localPatient });
        }

        // 2️⃣ Query ABDM sandbox
        const abdmData = await searchByABHAId(abhaId);

        // 3️⃣ Auto-create patient from ABDM data
        const newPatient = await Patient.create({
            fullName: abdmData.name || "Unknown",
            abhaId: abdmData.healthIdNumber || abhaId,
            abhaAddress: abdmData.healthId,
            phone: abdmData.mobile,
            gender:
                abdmData.gender === "M" ? "male" :
                    abdmData.gender === "F" ? "female" : "other",
            dateOfBirth: abdmData.yearOfBirth
                ? new Date(`${abdmData.yearOfBirth}-01-01`)
                : undefined,
            abhaVerified: true,
            abhaVerifiedAt: new Date(),
        });

        res.json({ success: true, source: "abdm", data: newPatient });

    } catch (err) {
        if (err.response?.status === 404) {
            return res.status(404).json({
                success: false,
                message: "No ABHA record found for this ID",
            });
        }
        console.error("fetchPatientByABHA error:", err.response?.data || err.message);
        res.status(502).json({
            success: false,
            message: "ABDM lookup failed",
            detail: err.response?.data,
        });
    }
};