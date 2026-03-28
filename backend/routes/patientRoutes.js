const express = require("express");
const router = express.Router();

const Patient = require("../models/PatientModel.js");

// 🔍 GET /patients?search=ram → Search patients
// 🔍 GET /patients?search=ram → Search patients
router.get("/search", async (req, res) => {
    try {
        const { search } = req.query;

        // ❌ Block if search not provided
        if (!search || search.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Search query is required"
            });
        }

        // ✅ Search across multiple fields
        const patients = await Patient.find({
            $or: [
                { fullName: { $regex: `^${search}$`, $options: "i" } }, // exact match
                { phone: { $regex: `^${search}$`, $options: "i" } },
                { bloodGroup: { $regex: `^${search}$`, $options: "i" } },
                { "emergencyContact.name": { $regex: `^${search}$`, $options: "i" } },
                { "emergencyContact.phone": { $regex: `^${search}$`, $options: "i" } }
            ]
        }).limit(20);

        // ✅ No patients found
        if (patients.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: "No patients found"
            });
        }

        res.status(200).json({
            success: true,
            data: patients
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ➕ POST /patients → Register patient
router.post("/", async (req, res) => {
    try {
        const patient = await Patient.create(req.body);

        res.status(201).json({
            success: true,
            data: patient
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


// 📄 GET /patients/:id → Get single patient
router.get("/:id", async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        res.status(200).json({
            success: true,
            data: patient
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;