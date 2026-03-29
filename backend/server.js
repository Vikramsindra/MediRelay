const express = require("express");
const cors = require("cors");
const app = express();

// ── Routes (new spec-aligned)
const userRoutes = require("./routes/userRoutes");         // /api/v1/users  (doctor auth)
const patientRoutes = require("./routes/patientRoutes");   // /api/v1/patients
const transferRoutes = require("./routes/transferRoutes"); // /api/v1/transfers

// ── Legacy routes (kept for backward compat — patient OTP auth, staff JWT auth)
const authStaffRoutes = require("./routes/authStaffRoutes");   // /api/auth/staff
const authPatientRoutes = require("./routes/authPatientRoutes"); // /api/auth/patient

// ─── CORS — allow all origins for development / LAN device testing
app.use(
    cors({
        origin: "*",
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request logging middleware
app.use((req, _res, next) => {
    console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ─── Health check
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.get("/test", (_req, res) => res.send("test route is working"));

// ─── Primary API (matches spec)
app.use("/api/v1/users", userRoutes);         // Doctor signup/login/logout
app.use("/api/v1/patients", patientRoutes);   // Patient CRUD (doctor-registered)
app.use("/api/v1/transfers", transferRoutes); // Transfer records + QR

// ─── Legacy API (patient OTP flow + staff JWT — kept for backward compat)
app.use("/api/auth/staff", authStaffRoutes);
app.use("/api/auth/patient", authPatientRoutes);

// ─── 404 fallback
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
});

module.exports = app;
