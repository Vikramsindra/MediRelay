/**
 * Auth routes for Doctors (Users)
 * POST /api/v1/users/signup  — Register doctor
 * POST /api/v1/users/login   — Login doctor
 * POST /api/v1/users/logout  — Stateless logout (frontend clears storage)
 *
 * No JWT — doctorId (_id) IS the session token.
 * Frontend persists: { doctorId, name, hospitalName, email }
 */

const express = require("express");
const router = express.Router();
const User = require("../models/UserModel");

// ─────────────────────────────
// POST /signup
// ─────────────────────────────
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, hospitalName } = req.body || {};

        if (!name || !email || !password || !hospitalName) {
            return res.status(400).json({
                success: false,
                message: "name, email, password, and hospitalName are required",
            });
        }

        const lowerEmail = String(email).trim().toLowerCase();

        // Check duplicate
        const existing = await User.findOne({ email: lowerEmail });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        const user = await User.create({
            name: String(name).trim(),
            email: lowerEmail,
            password: String(password),
            hospitalName: String(hospitalName).trim(),
        });

        return res.status(201).json({
            success: true,
            data: {
                doctorId: user._id,
                name: user.name,
                email: user.email,
                hospitalName: user.hospitalName,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// POST /login
// ─────────────────────────────
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email and password are required",
            });
        }

        const lowerEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: lowerEmail }).select("+password");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        return res.status(200).json({
            success: true,
            data: {
                doctorId: user._id,
                name: user.name,
                email: user.email,
                hospitalName: user.hospitalName,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// POST /logout  (stateless — frontend clears storage)
// ─────────────────────────────
router.post("/logout", (_req, res) => {
    return res.status(200).json({ success: true, message: "Logged out" });
});

module.exports = router;
