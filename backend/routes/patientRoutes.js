const express = require("express");
const router = express.Router();

const Patient = require("../models/PatientModel.js");

// � GET /patients → Get all patients
router.get("/search", async (req, res) => {
    try {
        const { search } = req.query;

        // If no search param, return all patients
        if (!search || search.trim() === "") {
            const patients = await Patient.find().sort({ createdAt: -1 }).limit(100);
            return res.status(200).json({
                success: true,
                data: patients
            });
        }

        // Search across multiple fields
        const patients = await Patient.find({
            $or: [
                { fullName: { $regex: `^${search}$`, $options: "i" } },
                { phone: { $regex: `^${search}$`, $options: "i" } },
                { bloodGroup: { $regex: `^${search}$`, $options: "i" } },
                { "emergencyContact.name": { $regex: `^${search}$`, $options: "i" } },
                { "emergencyContact.phone": { $regex: `^${search}$`, $options: "i" } }
            ]
        }).limit(20);

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

// GET all patients via root route (fallback)
router.get("/", async (req, res) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 }).limit(100);
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

module.exports = router;