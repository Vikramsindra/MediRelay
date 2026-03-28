const Transfer = require("../models/TransferRecord");
const Patient = require("../models/PatientModel");

// GET /api/v1/transfers/history/:abhaId
// Doctors: any patient | Patients: own record only
exports.getPatientHistory = async (req, res) => {
    try {
        const { abhaId } = req.params;

        // 🔐 Access control — patients can only view their own history
        if (req.user.role === "patient") {
            const myPatient = await Patient.findOne({ userId: req.user._id });
            if (!myPatient || myPatient.abhaId !== abhaId) {
                return res.status(403).json({ success: false, message: "Access denied" });
            }
        }

        // 📌 Verify patient exists
        const patient = await Patient.findOne({ abhaId });
        if (!patient) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        // 📌 Get all transfers for this ABHA ID (oldest → newest)
        const transfers = await Transfer.find({ "patient.abhaId": abhaId }).sort({ createdAt: 1 });

        // 📊 Timeline
        const timeline = transfers.map(t => ({
            id: t._id,
            shareId: t.shareId,
            date: t.createdAt,
            from: t.sendingHospital,
            to: t.receivingHospital,
            status: t.status,
            severity: t.severity,
            complaint: t.chiefComplaint,
            doctor: t.doctorName,
            arrivedAs: t.acknowledgement?.arrivalCondition,
        }));

        // 📈 Vitals trend across transfers
        const vitalsTrend = transfers.map(t => ({
            date: t.createdAt,
            bp: t.vitals?.bloodPressure,
            hr: t.vitals?.heartRate,
            spo2: t.vitals?.spo2,
            temp: t.vitals?.temperature,
            gcs: t.vitals?.gcs,
        }));

        // 💊 Medication history (grouped by drug name)
        const medicationHistory = {};
        transfers.forEach(t => {
            (t.activeMedications || []).forEach(med => {
                if (!medicationHistory[med.name]) {
                    medicationHistory[med.name] = [];
                }
                medicationHistory[med.name].push({ date: t.createdAt, dose: med.dose });
            });
        });

        res.json({
            success: true,
            patient: {
                name: patient.fullName,
                abhaId: patient.abhaId,
                gender: patient.gender,
            },
            totalTransfers: transfers.length,
            timeline,
            vitalsTrend,
            medicationHistory,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};