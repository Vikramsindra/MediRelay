/**
 * Transfer routes — /api/v1/transfers
 *
 * POST  /                       — Create transfer (doctorId in body)
 * GET   /?doctorId=             — All transfers for doctor's patients
 * GET   /?patientId=            — All transfers for one patient
 * GET   /share/:shareId         — Public — fetch by shareId (QR link), NO auth
 * GET   /:id                    — Single transfer by MongoDB _id
 * PATCH /:id                    — Update any field (e.g. status → "acknowledged")
 *
 * On creation:
 *   - Fetches patient from DB and embeds frozen snapshot into `patient`
 *   - Generates shareId = "{patientId}-{base36timestamp}"
 *   - Builds compact QR payload (LZ-String compressed — done on frontend, here we
 *     return the raw payload object that the frontend compresses)
 *   - Returns: { data, link, qrPayload }
 */

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Transfer = require("../models/trasferRecord");
const Patient = require("../models/DoctorPatientModel");
const User = require("../models/UserModel");

// ─────────────────────────────────────────────
// Compact QR payload builder (mirrors frontend buildTransferQrPayload)
// compact keys: i,pi,pn,c,s,dg,to,fr,v,sm,inv,tm,dr,m,sh,ps,ts
// ─────────────────────────────────────────────
function buildQrPayload(transfer) {
    const t = transfer.toObject ? transfer.toObject() : transfer;
    const p = t.patient || {};

    return {
        i: String(t._id),
        pi: t.patientId ? String(t.patientId) : undefined,
        pn: p.fullName,
        c: t.conditionCategory,
        s: t.severity,
        dg: t.chiefComplaint,
        to: t.receivingHospital,
        fr: t.sendingHospital,
        dr: t.doctorName,
        sh: t.shareId,
        ts: t.timestamp ? new Date(t.timestamp).toISOString() : new Date().toISOString(),
        v: t.vitals
            ? {
                  bp: t.vitals.bp,
                  hr: t.vitals.hr,
                  sp: t.vitals.spo2,
                  tp: t.vitals.temp,
                  rr: t.vitals.rr,
                  gc: t.vitals.gcs,
                  bs: t.vitals.bloodSugar,
              }
            : undefined,
        sm: t.clinicalSummary,
        inv: t.pendingInvestigations,
        tm: t.modeOfTransfer,
        cd: t.conditionDetails,
        m: (t.activeMedications || []).map((med) => ({
            n: med.name,
            d: med.dose,
            r: med.route,
            lg: med.lastGivenAt,
            ms: med.mustNotStop,
        })),
        ps: {
            al: (p.allergies || []).map((a) => ({ ag: a.allergen, rx: a.reaction })),
            nka: p.noKnownAllergies,
            pm: (p.permanentMedications || []).map((m) => ({
                n: m.name,
                d: m.dose,
                r: m.route,
                fr: m.frequency,
            })),
            nrm: p.noRegularMedications,
            bg: p.bloodGroup,
            ec: p.emergencyContact,
        },
        rf: t.reasonForTransfer,
    };
}

// ─────────────────────────────
// POST /  — Create transfer
// ─────────────────────────────
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
            conditionDetails,
            activeMedications,
            clinicalSummary,
            pendingInvestigations,
            modeOfTransfer,
        } = req.body || {};

        // Validate required fields
        if (!patientId) {
            return res.status(400).json({ success: false, message: "patientId is required" });
        }
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ success: false, message: "Invalid patientId" });
        }
        if (!sendingHospital || !doctorName || !chiefComplaint || !conditionCategory || !severity || !reasonForTransfer) {
            return res.status(400).json({
                success: false,
                message: "sendingHospital, doctorName, chiefComplaint, conditionCategory, severity, reasonForTransfer are required",
            });
        }

        // Fetch patient and embed snapshot
        const patient = await Patient.findById(patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // Build patient snapshot (frozen copy without mongoose metadata)
        const patientSnapshot = {
            fullName: patient.fullName,
            age: patient.age,
            sex: patient.sex,
            bloodGroup: patient.bloodGroup,
            phone: patient.phone,
            emergencyContact: patient.emergencyContact,
            noKnownAllergies: patient.noKnownAllergies,
            allergies: patient.allergies,
            chronicConditions: patient.chronicConditions,
            noRegularMedications: patient.noRegularMedications,
            permanentMedications: patient.permanentMedications,
        };

        // Generate unique shareId
        const shareId = `${patient._id.toString()}-${Date.now().toString(36)}`;

        // Normalize BP field if sent as {sys, dia}
        let bpString = null;
        if (vitals) {
            if (vitals.bpSys && vitals.bpDia) {
                bpString = `${vitals.bpSys}/${vitals.bpDia}`;
            } else if (vitals.bp) {
                bpString = vitals.bp;
            }
        }

        // Build vitals object
        const vitalsDoc = vitals
            ? {
                  bp: bpString,
                  hr: vitals.hr ? Number(vitals.hr) : undefined,
                  spo2: vitals.spo2 ? Number(vitals.spo2) : undefined,
                  temp: vitals.temp ? Number(vitals.temp) : undefined,
                  rr: vitals.rr ? Number(vitals.rr) : undefined,
                  gcs: vitals.gcs ? Number(vitals.gcs) : undefined,
                  bloodSugar: vitals.bloodSugar || vitals.bsl ? Number(vitals.bloodSugar || vitals.bsl) : undefined,
              }
            : {};

        const transfer = await Transfer.create({
            patientId: patient._id,
            patient: patientSnapshot,
            sendingHospital,
            receivingHospital: receivingHospital || null,
            doctorName,
            chiefComplaint,
            conditionCategory,
            severity,
            reasonForTransfer,
            vitals: vitalsDoc,
            conditionDetails: conditionDetails || {},
            activeMedications: activeMedications || [],
            clinicalSummary: clinicalSummary ? String(clinicalSummary).slice(0, 150) : null,
            pendingInvestigations: pendingInvestigations || [],
            modeOfTransfer: modeOfTransfer || undefined,
            shareId,
            status: "submitted",
            timestamp: new Date(),
        });

        // Build the compact QR payload (frontend will LZ-String compress + prefix "MR1:")
        const qrPayload = buildQrPayload(transfer);

        // Public share link
        const API_URL = process.env.API_BASE_URL || "http://localhost:8080";
        const link = `${API_URL}/api/v1/transfers/share/${shareId}`;

        return res.status(201).json({
            success: true,
            data: transfer,
            link,
            qrPayload,
        });
    } catch (error) {
        console.error("POST /transfers error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────
// GET /  — List transfers (by doctorId OR by patientId)
// Note: Must be before /:id route
// ─────────────────────────────────────────────────────
router.get("/", async (req, res) => {
    try {
        const { doctorId, patientId } = req.query;

        let filter = {};

        if (patientId) {
            // Filter by specific patient
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                return res.status(400).json({ success: false, message: "Invalid patientId" });
            }
            filter.patientId = patientId;
        } else if (doctorId) {
            // Find all patients belonging to this doctor, then get their transfers
            if (!mongoose.Types.ObjectId.isValid(doctorId)) {
                return res.status(400).json({ success: false, message: "Invalid doctorId" });
            }
            // Get all patient ids for this doctor
            const patientIds = await Patient.find({ doctorId }).distinct("_id");
            filter.patientId = { $in: patientIds };
        }
        // If neither, return all (for admin/debug; can restrict if needed)

        const transfers = await Transfer.find(filter)
            .sort({ createdAt: -1 })
            .limit(200);

        return res.status(200).json({ success: true, data: transfers });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────────────────────────────
// GET /share/:shareId — Public — fetch by shareId (QR/link)
// MUST be before /:id to avoid conflict
// ─────────────────────────────────────────────────────
router.get("/share/:shareId", async (req, res) => {
    try {
        const transfer = await Transfer.findOne({ shareId: req.params.shareId });
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        return res.status(200).json({ success: true, data: transfer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// GET /:id — Single transfer by MongoDB _id
// ─────────────────────────────
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid transfer id" });
        }

        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        return res.status(200).json({ success: true, data: transfer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// ─────────────────────────────
// PATCH /:id — Update transfer (e.g. status → "acknowledged")
// ─────────────────────────────
router.patch("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid transfer id" });
        }

        // Prevent overwriting the frozen patient snapshot or shareId via patch
        const { patient: _p, shareId: _s, patientId: _pi, ...safeUpdates } = req.body || {};

        const transfer = await Transfer.findByIdAndUpdate(
            req.params.id,
            { $set: safeUpdates },
            { new: true, runValidators: true }
        );

        if (!transfer) {
            return res.status(404).json({ success: false, message: "Transfer not found" });
        }

        return res.status(200).json({ success: true, data: transfer });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;