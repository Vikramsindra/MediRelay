const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Patient = require("../models/PatientModel.js");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// � GET /patients → List patients
router.get("/", async (req, res) => {
    try {
        const { doctorId } = req.query;

        if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required"
            });
        }

        const patients = await Patient.find({ doctorId }).sort({ createdAt: -1 }).limit(100);

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

// 🔍 GET /patients/search?search=ram → Search patients
router.get("/search", async (req, res) => {
    try {
        const { search, doctorId } = req.query;

        if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required"
            });
        }

        // ❌ Block if search not provided
        if (!search || search.trim() === "") {
            const patients = await Patient.find({ doctorId }).sort({ createdAt: -1 }).limit(100);
            return res.status(200).json({
                success: true,
                data: patients
            });
        }

        const query = new RegExp(escapeRegExp(search), "i");

        // ✅ Search across multiple fields
        const patients = await Patient.find({
            doctorId,
            $or: [
                { fullName: query },
                { phone: query },
                { bloodGroup: query },
                { "emergencyContact.name": query },
                { "emergencyContact.phone": query }
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
        const { fullName, age, sex, doctorId, abhaId } = req.body;

        if (!fullName || !age || !sex || !doctorId) {
            return res.status(400).json({
                success: false,
                message: "doctorId, fullName, age, and sex are required"
            });
        }

        // ✅ Validate ABHA ID format if provided
        if (abhaId) {
            const normalizedAbhaId = String(abhaId).trim();
            
            if (!/^\d{2}-\d{4}-\d{4}-\d{4}$/.test(normalizedAbhaId)) {
                return res.status(400).json({
                    success: false,
                    message: "ABHA ID format should be like 91-1234-5678-9012"
                });
            }

            // ✅ Check for duplicate ABHA ID (proactive check)
            const existingPatient = await Patient.findOne({
                abhaId: normalizedAbhaId
            });

            if (existingPatient) {
                return res.status(409).json({
                    success: false,
                    message: "ABHA ID already exists in the system",
                    existingPatient: {
                        id: existingPatient._id,
                        fullName: existingPatient.fullName,
                        age: existingPatient.age,
                        sex: existingPatient.sex,
                        createdAt: existingPatient.createdAt
                    }
                });
            }

            req.body.abhaId = normalizedAbhaId;
        }

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        const patient = await Patient.create(req.body);

        res.status(201).json({
            success: true,
            data: patient
        });

    } catch (error) {
        if (error?.code === 11000 && error?.keyPattern?.abhaId) {
            return res.status(409).json({
                success: false,
                message: "ABHA ID already exists"
            });
        }

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

router.get("/doctor/:doctorId", async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { search } = req.query;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        let query = { doctorId };

        if (search) {
            query.fullName = { $regex: search, $options: "i" };
        }

        const patients = await Patient.find(query).sort({ createdAt: -1 });

        if (patients.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No patients found"
            });
        }

        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// 📄 GET /patients/:id → Get single patient
router.get("/:id", async (req, res) => {
    try {
        const { doctorId } = req.query;

        if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID"
            });
        }

        const patient = await Patient.findOne({ _id: req.params.id, doctorId });

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