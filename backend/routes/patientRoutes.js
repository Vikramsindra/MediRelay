const express = require("express");
const router  = express.Router();

// No ABHA imports here — those live in authRoutes.js
const Patient = require("../models/PatientModel");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────────
// GET /api/v1/patients/search?search=ram
// Doctors only — search across name, phone, blood group, emergency contact
// ─────────────────────────────────────────────────────────
router.get("/search", protect, restrictTo("doctor"), async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim() === "") {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }

        const patients = await Patient.find({
            $or: [
                { fullName:   { $regex: search.trim(), $options: "i" } },
                { phone:      { $regex: `^${search.trim()}`, $options: "i" } },
                { abhaId:     { $regex: search.trim(), $options: "i" } },
                { bloodGroup: { $regex: `^${search.trim()}$`, $options: "i" } },
                { "emergencyContact.name":  { $regex: search.trim(), $options: "i" } },
                { "emergencyContact.phone": { $regex: `^${search.trim()}`, $options: "i" } },
            ],
        }).limit(20);

        res.status(200).json({
            success: true,
            count:   patients.length,
            data:    patients,
            message: patients.length === 0 ? "No patients found" : undefined,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/patients/me
// Patient sees their own clinical profile
// ─────────────────────────────────────────────────────────
router.get("/me", protect, restrictTo("patient"), async (req, res) => {
    try {
        const patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient profile not found" });
        }
        res.status(200).json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/patients
// Doctors create a patient record manually
// ─────────────────────────────────────────────────────────
router.post("/", protect, restrictTo("doctor"), async (req, res) => {
    try {
        // If abhaId is provided, prevent duplicates
        if (req.body.abhaId) {
            const existing = await Patient.findOne({ abhaId: req.body.abhaId });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: "A patient with this ABHA ID already exists",
                    data:    existing, // return existing so frontend can use it
                });
            }
        }

        const patient = await Patient.create(req.body);
        res.status(201).json({ success: true, data: patient });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/patients/:id
// ─────────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // Patients can only view their own record
        if (
            req.user.role === "patient" &&
            patient.userId?.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        res.status(200).json({ success: true, data: patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/patients/:id
// ─────────────────────────────────────────────────────────
router.patch("/:id", protect, restrictTo("doctor"), async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }
        res.status(200).json({ success: true, data: patient });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;