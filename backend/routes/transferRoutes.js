const express = require("express");
const router = express.Router();
const { getPatientHistory } = require("../controllers/abhaHistoryController");
const Transfer = require("../models/TransferRecord");   // fixed filename (was trasferRecord)
const Patient = require("../models/PatientModel");
const { protect, restrictTo, optionalAuth } = require("../middleware/authMiddleware");
const { generateQRCode, getShareUrl } = require("../utils/generateQR");
const { extractVitalsFromText, autoDetectSeverity } = require("../utils/vitalsHelper");
const { parseVitals } = require("../controllers/transferController");
// ─────────────────────────────────────────────────────────────────
// IMPORTANT: /share/:shareId MUST be defined BEFORE /:id
// Otherwise Express matches "share" as a MongoDB ObjectId → CastError crash
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// GET /api/v1/transfers/share/:shareId   (PUBLIC — no auth required)
// QR code scans hit this endpoint. Works without login.
// ─────────────────────────────────────────────────────────
router.get("/share/:shareId", optionalAuth, async (req, res) => {
    try {
        const transfer = await Transfer.findOne({ shareId: req.params.shareId });
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        // Return a structured response with critical info at the top.
        // Frontend should render the `critical` block FIRST (no scrolling needed).
        const response = {
            _id: transfer._id,
            shareId: transfer.shareId,
            status: transfer.status,
            createdAt: transfer.createdAt,

            // 🚨 Critical block — show this first, above the fold
            critical: {
                allergies: transfer.allergies,
                criticalMedications: transfer.criticalMedications,
                severity: transfer.severity,
                chiefComplaint: transfer.chiefComplaint,
                reasonForTransfer: transfer.reasonForTransfer,
            },

            patient: {
                fullName: transfer.patient.fullName,
                abhaId: transfer.patient.abhaId,
                dateOfBirth: transfer.patient.dateOfBirth,
                gender: transfer.patient.gender,
                bloodGroup: transfer.patient.bloodGroup,
                phone: transfer.patient.phone,
            },

            clinical: {
                diagnosis: transfer.diagnosis,
                conditionCategory: transfer.conditionCategory,
                clinicalSummary: transfer.clinicalSummary,
                vitals: transfer.vitals,
                activeMedications: transfer.activeMedications,
                pendingInvestigations: transfer.pendingInvestigations,
                modeOfTransfer: transfer.modeOfTransfer,
            },

            hospitals: {
                sending: transfer.sendingHospital,
                receiving: transfer.receivingHospital,
                doctor: transfer.doctorName,
            },

            acknowledgement: transfer.acknowledgement,
        };

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/transfers/timeline/:abhaId
// Full chronological journey of a patient across hospitals
// ─────────────────────────────────────────────────────────
router.get("/timeline/:abhaId", protect, async (req, res) => {
    try {
        const transfers = await Transfer.find({ "patient.abhaId": req.params.abhaId })
            .sort({ createdAt: 1 })
            .select("createdAt sendingHospital receivingHospital status severity chiefComplaint doctorName acknowledgement shareId");

        if (transfers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No transfer history found for this ABHA ID",
            });
        }

        const timeline = transfers.map(t => ({
            transferId: t._id,
            shareId: t.shareId,
            date: t.createdAt,
            from: t.sendingHospital,
            to: t.receivingHospital,
            status: t.status,
            severity: t.severity,
            chiefComplaint: t.chiefComplaint,
            doctor: t.doctorName,
            arrivedAs: t.acknowledgement?.arrivalCondition,
        }));

        res.json({ success: true, abhaId: req.params.abhaId, timeline });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
router.get("/history/:abhaId", protect, getPatientHistory);
// ─────────────────────────────────────────────────────────
// GET /api/v1/transfers
// Doctors → all transfers (filter by patientId or abhaId)
// Patients → automatically filtered to their own
// ─────────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
    try {
        const { patientId, abhaId, status } = req.query;
        let query = {};

        if (req.user.role === "patient") {
            // Patient can only see their own history
            const patient = await Patient.findOne({ userId: req.user._id });
            if (patient?.abhaId) {
                query["patient.abhaId"] = patient.abhaId;
            } else if (patient?._id) {
                query["patient._id"] = patient._id;
            }
        } else {
            // Doctor can filter explicitly
            if (abhaId) query["patient.abhaId"] = abhaId;
            if (patientId) query["patient._id"] = patientId;
        }

        if (status) query.status = status;

        const transfers = await Transfer.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: transfers.length, data: transfers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// ─────────────────────────────────────────────────────────
// POST /api/v1/transfers/parse-vitals
// Parse free-text vitals and auto-detect severity (no auth)
// ─────────────────────────────────────────────────────────
router.post("/parse-vitals", parseVitals);

// ─────────────────────────────────────────────────────────
// POST /api/v1/transfers
// Doctor creates a new transfer record
// ─────────────────────────────────────────────────────────
router.post("/", protect, restrictTo("doctor"), async (req, res) => {
    try {
        const {
            patientId,
            sendingHospital,
            receivingHospital,
            chiefComplaint,
            conditionCategory,
            severity,
            reasonForTransfer,
            diagnosis,
            vitals,
            vitalsText,
            activeMedications,
            clinicalSummary,
            pendingInvestigations,
            modeOfTransfer,
        } = req.body;

        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        const meds = activeMedications || [];

        // Extract must-not-stop medication names for the critical block
        const criticalMedications = meds
            .filter(m => m.isCritical)
            .map(m => m.name);

        const shareId = `${patient._id.toString().slice(-6)}-${Date.now().toString(36)}`;

        // ─── Auto-parse vitals from free text (if provided) ──────────
        const parsedVitals = vitalsText ? extractVitalsFromText(vitalsText) : {};
        const mergedVitals = { ...parsedVitals, ...(vitals || {}) }; // manual fields override parsed

        // ─── Auto-detect severity (use manual if provided) ───────────
        const autoSeverity = autoDetectSeverity(mergedVitals, chiefComplaint);
        const finalSeverity = severity || autoSeverity;

        const transfer = await Transfer.create({
            patient: {
                _id: patient._id,
                fullName: patient.fullName,
                abhaId: patient.abhaId,
                abhaAddress: patient.abhaAddress,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                bloodGroup: patient.bloodGroup,
                phone: patient.phone,
                knownAllergies: patient.knownAllergies,
            },
            sendingHospital,
            sendingDoctorId: req.user._id,
            doctorName: req.user.name,    // works now because protect() does DB lookup
            receivingHospital,
            chiefComplaint,
            conditionCategory,
            severity: finalSeverity,
            reasonForTransfer,
            diagnosis,
            vitals: mergedVitals,
            activeMedications: meds,
            criticalMedications,
            allergies: patient.knownAllergies || [],
            clinicalSummary,
            pendingInvestigations: pendingInvestigations || [],
            modeOfTransfer,
            shareId,
            status: "submitted",
        });

        // Generate QR code
        // This line in your POST route now correctly gets the Base64 image
        const qrCodeUrl = await generateQRCode(shareId);

        // This line gets the text version of the link (useful for 'Copy Link' buttons)
        const shareUrl = getShareUrl(shareId);
        if (qrCodeUrl) {
            transfer.qrCodeUrl = qrCodeUrl;
            await transfer.save();
        }

        res.status(201).json({
            success: true,
            data: transfer,
            shareUrl,
            qrCodeUrl,
            autoDetected: {
                severity: autoSeverity,
                vitals: parsedVitals,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/transfers/scan/:shareId  (PUBLIC — QR code scan endpoint)
// MUST be defined BEFORE /:id to avoid Express matching "scan" as an ObjectId
// ─────────────────────────────────────────────────────────
router.get("/scan/:shareId", async (req, res) => {
    try {
        const transfer = await Transfer.findOne({ shareId: req.params.shareId });

        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer record not found" });
        }

        res.json({ success: true, data: transfer });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during scan" });
    }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/transfers/:id
// ─────────────────────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        // Patients can only view transfers linked to them
        if (req.user.role === "patient") {
            const patient = await Patient.findOne({ userId: req.user._id });
            const isOwner =
                transfer.patient._id.toString() === patient?._id.toString() ||
                (transfer.patient.abhaId && transfer.patient.abhaId === patient?.abhaId);

            if (!isOwner) {
                return res.status(403).json({ success: false, message: "Access denied" });
            }
        }

        res.status(200).json({ success: true, data: transfer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/transfers/:id
// Update transfer (only before acknowledgement)
// ─────────────────────────────────────────────────────────
router.patch("/:id", protect, restrictTo("doctor"), async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        if (transfer.status !== "submitted") {
            return res.status(400).json({
                success: false,
                message: "Cannot edit a transfer that has already been acknowledged",
            });
        }

        const updated = await Transfer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/transfers/:id/acknowledge
// Receiving doctor marks transfer as reviewed
// ─────────────────────────────────────────────────────────
router.patch("/:id/acknowledge", protect, restrictTo("doctor"), async (req, res) => {
    try {
        const { arrivalCondition, arrivalNotes, discrepancies } = req.body;

        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        if (transfer.status === "acknowledged") {
            return res.status(400).json({ success: false, message: "Transfer already acknowledged" });
        }

        transfer.acknowledgement = {
            acknowledgedBy: req.user.name,
            acknowledgedAt: new Date(),
            arrivalCondition,
            arrivalNotes,
            discrepancies,
        };
        transfer.status = "acknowledged";
        await transfer.save();

        res.status(200).json({
            success: true,
            data: transfer,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;