// dotenv MUST be first — before any other require that reads process.env
require("dotenv").config();
const mongoose = require('mongoose');
const express  = require("express");
const cors     = require("cors");
const connectDB = require("./config/db");

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────
app.use("/api/v1/auth",         require("./routes/authRoutes"));
app.use("/api/v1/patients",  require("./routes/patientRoutes"));
app.use("/api/v1/transfers", require("./routes/transferRoutes"));

// ─── Health check ─────────────────────────────────────────
app.get("/test", (req, res) => res.json({ message: "MediRelay API running" }));

// ─── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 8080;

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();

module.exports = app;
