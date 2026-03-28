const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { sendOTP, verifyOTP, fetchPatientByABHA } = require("../controllers/abhaController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// ── Doctor / Patient email auth ───────────────────────────
router.post("/register", register);
router.post("/login", login);

// ── Patient ABHA OTP auth (no existing account needed) ───
// POST /api/v1/auth/abha/send-otp    { mobile }        → { txnId }
// POST /api/v1/auth/abha/verify-otp  { txnId, otp }   → { token, user, patient }
router.post("/abha/send-otp", sendOTP);
router.post("/abha/verify-otp", verifyOTP);

// ── Doctor: fetch patient details by ABHA ID ─────────────
router.get("/abha/patient/:abhaId", protect, restrictTo("doctor"), fetchPatientByABHA);

// ── Health check ──────────────────────────────────────────
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth route working" });
});

module.exports = router;
