const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const { sendOTP, verifyOTP, fetchPatientByABHA } = require("../controllers/abhaController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// ── Doctor / Patient email auth ───────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Patient ABHA OTP auth (no existing account needed) ───
// Step 1: POST /api/auth/abha/send-otp   { mobile }  → { txnId }
// Step 2: POST /api/auth/abha/verify-otp { txnId, otp } → { token, user, patient }
router.post("/abha/send-otp", sendOTP);
router.post("/abha/verify-otp", verifyOTP);

// ── Doctor: fetch patient details by ABHA ID ─────────────
// Used in transfer creation form to auto-fill patient data
router.get("/abha/patient/:abhaId", protect, restrictTo("doctor"), fetchPatientByABHA);
router.get("/test", (req, res) => {
  res.send("Auth route working");
});
module.exports = router;