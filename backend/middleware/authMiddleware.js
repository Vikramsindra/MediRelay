const jwt  = require("jsonwebtoken");
const User = require("../models/UserModel");

// ─── Full auth (requires valid token + active user in DB) ──
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch full user from DB — this is what was missing before.
        // Without this, req.user only has { id, role, email } from the JWT payload.
        // The transferController needs req.user.name (doctorName), req.user.hospital, etc.
        const user = await User.findById(decoded.id).select("-password");

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: "User not found or inactive" });
        }

        req.user = user; // full Mongoose document now
        next();

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        return res.status(401).json({ success: false, message: "Invalid token" });
    }
};

// ─── Role guard ────────────────────────────────────────────
// Usage: restrictTo("doctor")  or  restrictTo("doctor", "patient")
const restrictTo = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: `Access restricted to: ${roles.join(", ")}`,
        });
    }
    next();
};

// ─── Optional auth — attaches user only if token present ──
// Used on public share/QR routes where login is NOT required
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch {
        next(); // bad/expired token on a public route → just continue without user
    }
};

module.exports = { protect, restrictTo, optionalAuth };