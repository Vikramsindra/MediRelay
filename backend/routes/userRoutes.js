const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const User = require("../models/UserModel.js");


// ==============================
// 🆕 CREATE USER (with hashing)
// ==============================
router.post("/create", async (req, res) => {
    try {
        const { name, email, hospitalName, password } = req.body;

        // check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({
                success: false,
                message: "User already exists"
            });
        }

        // 🔐 HASH PASSWORD HERE
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            hospitalName,
            password: hashedPassword   // ✅ stored hashed
        });

        res.json({
            success: true,
            message: "User created",
            doctorId: user._id
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// 🔐 LOGIN (compare hashed)
// ==============================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // 🔑 COMPARE HASH
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Wrong password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            doctorId: user._id,
            name: user.name,
            hospitalName: user.hospitalName
        });

    } catch (error) {
        res.json({
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