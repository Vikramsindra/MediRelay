const mongoose = require("mongoose");

const transferRecordSchema = new mongoose.Schema({
    // 🔗 SHARING (Moved to top for clarity)
    shareId: { type: String, unique: true },
    qrCodeUrl: { type: String }, // Renamed to match your route logic
    reportId: { type: String },

    // 👤 PATIENT DETAILS (Embedded)
    patient: {
        _id: mongoose.Schema.Types.ObjectId, // Added to link to Patient collection
        fullName: { type: String, required: true },
        abhaId: String,
        abhaAddress: String,
        dateOfBirth: Date,
        age: { type: Number },
        gender: { type: String }, // Matches your route code
        sex: { type: String, enum: ["M", "F", "Other"] }, 
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
        },
        phone: String,
        knownAllergies: [String], // Added to sync with route's "allergies" logic
    },

    // 🏥 META INFO
    sendingHospital: { type: String, required: true },
    receivingHospital: String,
    sendingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    doctorName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },

    // 🚨 SECTION 1 — SITUATION
    chiefComplaint: { type: String, required: true },
    conditionCategory: {
        type: String,
        enum: ["Cardiac", "Neuro", "Trauma", "Obstetric", "Respiratory", "Renal", "Neonatal", "Other"],
        required: true
    },
    severity: {
        type: String,
        enum: ["Critical", "Serious", "Stable"],
        required: true
    },
    reasonForTransfer: { type: String, required: true },
    diagnosis: String,

    // ❤️ SECTION 2 — VITALS
    vitals: {
        bp: String,
        hr: Number,
        spo2: Number,
        temp: Number,
        rr: Number,
        gcs: Number,
        bloodSugar: Number
    },

    // 💊 SECTION 4 — ACTIVE MEDICATIONS
    activeMedications: [
        {
            name: { type: String, required: true },
            dose: { type: String, required: true },
            route: { type: String, enum: ["Oral", "IV", "IM"], required: true },
            lastGivenAt: String,
            isCritical: { type: Boolean, default: false } // Matches route logic
        }
    ],
    // New field to store the flattened list for the "Critical Block"
    criticalMedications: [String], 
    allergies: [String],

    // 📝 SECTION 5 — HANDOFF NOTE
    clinicalSummary: { type: String, maxlength: 150 },
    pendingInvestigations: [String],
    modeOfTransfer: {
        type: String,
        enum: ["Ambulance", "Air", "Private Vehicle"]
    },

    // 📊 STATUS & ACKNOWLEDGEMENT
    status: {
        type: String,
        enum: ["draft", "submitted", "acknowledged"],
        default: "draft"
    },
    acknowledgement: {
        acknowledgedBy: String,
        acknowledgedAt: Date,
        arrivalCondition: String,
        arrivalNotes: String,
        discrepancies: String
    }

}, { timestamps: true });

const TransferRecord = mongoose.model("TransferRecord", transferRecordSchema);
module.exports = TransferRecord;