const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/userModel.js");

async function handleSignup(req, res) {
    try {
        const { name, email, hospitalName, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: String(name || '').trim(),
            email: normalizedEmail,
            hospitalName: String(hospitalName || '').trim(),
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "User created",
            userId: user._id,
            doctorId: user._id,
            name: user.name,
            hospitalName: user.hospitalName,
            email: user.email
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


// ==============================
// 🆕 SIGNUP USER (with hashing)
// ==============================
router.post("/signup", handleSignup);

// backward compatibility
router.post("/create", handleSignup);


// ==============================
// 🔐 LOGIN (compare hashed)
// ==============================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail = String(email).trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 🔑 COMPARE HASH
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Wrong password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            userId: user._id,
            doctorId: user._id,
            name: user.name,
            hospitalName: user.hospitalName,
            email: user.email
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// 🚪 LOGOUT
// ==============================
router.post("/logout", (req, res) => {
    res.json({
        success: true,
        message: "Logged out"
    });
});


module.exports = router;