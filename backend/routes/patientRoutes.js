/**
 * Patient routes — /api/v1/patients
 *
 * POST  /                         — Register patient (doctorId in body, required)
 * GET   /?doctorId=               — List all patients for doctor (newest first, max 100)
 * GET   /search?doctorId=&search= — Search by name/phone/blood group (max 20)
 * GET   /:id?doctorId=            — Get single patient
 * GET   /doctor/:doctorId?search= — Alt list/search endpoint (alias)
 */

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Patient = require("../models/DoctorPatientModel");

// ─────────────────────────────
// GET /search?doctorId=&search=
// MUST be before /:id to avoid route conflict
// ─────────────────────────────
router.get("/search", async (req, res) => {
    try {
        const { doctorId, search } = req.query;

        if (!search || String(search).trim() === "") {
            return res.status(400).json({ success: false, message: "search query is required" });
        }

        const filter = {};
        if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
            filter.doctorId = doctorId;
        }

        const q = String(search).trim();
        filter.$or = [
            { fullName: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } },
            { bloodGroup: { $regex: `^${q}$`, $options: "i" } },
        ];

        const patients = await Patient.find(filter)
            .sort({ createdAt: -1 })
            .limit(20);

        return res.status(200).json({ success: true, data: patients });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// GET /doctor/:doctorId?search=
// Alt endpoint (alias for list/search)
// ─────────────────────────────
router.get("/doctor/:doctorId", async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { search } = req.query;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: "Invalid doctorId" });
        }

        const filter = { doctorId };

        if (search && String(search).trim() !== "") {
            const q = String(search).trim();
            filter.$or = [
                { fullName: { $regex: q, $options: "i" } },
                { phone: { $regex: q, $options: "i" } },
                { bloodGroup: { $regex: `^${q}$`, $options: "i" } },
            ];
        }

        const patients = await Patient.find(filter)
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json({ success: true, data: patients });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// POST /  — Register patient
// ─────────────────────────────
router.post("/", async (req, res) => {
    try {
        const {
            doctorId,
            fullName,
            age,
            sex,
            bloodGroup,
            phone,
            emergencyContact,
            noKnownAllergies,
            allergies,
            chronicConditions,
            noRegularMedications,
            permanentMedications,
        } = req.body || {};

        if (!doctorId) {
            return res.status(400).json({ success: false, message: "doctorId is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: "Invalid doctorId" });
        }
        if (!fullName || !age || !sex) {
            return res.status(400).json({ success: false, message: "fullName, age, sex are required" });
        }

        const patient = await Patient.create({
            doctorId,
            fullName: String(fullName).trim(),
            age: Number(age),
            sex,
            bloodGroup: bloodGroup || undefined,
            phone: phone || null,
            emergencyContact: emergencyContact || {},
            noKnownAllergies: !!noKnownAllergies,
            allergies: noKnownAllergies ? [] : (allergies || []),
            chronicConditions: chronicConditions || [],
            noRegularMedications: !!noRegularMedications,
            permanentMedications: noRegularMedications ? [] : (permanentMedications || []),
        });

        return res.status(201).json({ success: true, data: patient });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// GET /?doctorId=  — List all patients for doctor
// ─────────────────────────────
router.get("/", async (req, res) => {
    try {
        const { doctorId } = req.query;

        if (!doctorId) {
            return res.status(400).json({ success: false, message: "doctorId is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({ success: false, message: "Invalid doctorId" });
        }

        const patients = await Patient.find({ doctorId })
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json({ success: true, data: patients });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// GET /:id?doctorId= — Get single patient
// ─────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid patient id" });
        }

        const filter = { _id: id };
        if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
            filter.doctorId = doctorId;
        }

        const patient = await Patient.findOne(filter);
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        return res.status(200).json({ success: true, data: patient });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;