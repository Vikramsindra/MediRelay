const express = require("express");
const router = express.Router();

const Transfer = require("../models/trasferRecord.js");
const Patient = require("../models/PatientModel.js");

// ==============================
// 🆕 Create Transfer (Full Data, No Draft)
// ==============================
router.post("/", async (req, res) => {
    try {
        const {
            patientId,
            sendingHospital,
            receivingHospital,
            doctorName,
            chiefComplaint,
            conditionCategory,
            severity,
            reasonForTransfer,
            vitals,
            activeMedications,
            clinicalSummary,
            pendingInvestigations,
            modeOfTransfer
        } = req.body;

        // Fetch patient data from DB
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Generate a unique shareId for this transfer
        const shareId = `${patient._id.toString()}-${Date.now().toString(36)}`;

        // Create transfer record
        const transfer = await Transfer.create({
            patient,
            sendingHospital,
            receivingHospital,
            doctorName,
            chiefComplaint,
            conditionCategory,
            severity,
            reasonForTransfer,
            vitals: vitals || {},
            activeMedications: activeMedications || [],
            clinicalSummary,
            pendingInvestigations: pendingInvestigations || [],
            modeOfTransfer,
            shareId,
            status: "submitted" // directly submitted
        });

        res.status(201).json({
            success: true,
            data: transfer,
            link: `http://localhost:8080/api/v1/transfers/share/${shareId}`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ==============================
// 🔗 Get Transfer by Share ID (QR / Link)
// ==============================
router.get("/share/:shareId", async (req, res) => {
    try {
        const transfer = await Transfer.findOne({ shareId: req.params.shareId });
        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: transfer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ==============================
// 🔄 Update Transfer
// ==============================
router.patch("/:id", async (req, res) => {
    try {
        const transfer = await Transfer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: transfer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ==============================
// 📜 Get Transfer History (All or by Patient)
// ==============================
router.get("/", async (req, res) => {
    try {
        const { patientId } = req.query;

        let query = {};
        if (patientId) {
            query = { "patient._id": patientId };
        }

        const transfers = await Transfer.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: transfers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ==============================
// 📄 Get Single Transfer by ID
// ==============================
router.get("/:id", async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: transfer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;