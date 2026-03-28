const mongoose = require("mongoose");

const transferRecordSchema = new mongoose.Schema({

    // =========================
    // 👤 PATIENT DETAILS (Embedded)
    // =========================
    patient: {
        fullName: { type: String, required: true },
        age: { type: Number, required: true },
        sex: { type: String, enum: ["M", "F", "Other"], required: true },
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
        },
        phone: String,

        emergencyContact: {
            name: String,
            phone: String,
            relation: String
        },

        noKnownAllergies: { type: Boolean, default: false },
        allergies: [
            {
                allergen: String,
                reaction: String
            }
        ],

        chronicConditions: [String],

        noRegularMedications: { type: Boolean, default: false },
        permanentMedications: [
            {
                name: String,
                dose: String,
                route: String,
                frequency: String
            }
        ]
    },

    // =========================
    // 🏥 META INFO
    // =========================
    sendingHospital: { type: String, required: true },
    receivingHospital: String,
    doctorName: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },

    // =========================
    // 🚨 SECTION 1 — SITUATION
    // =========================
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

    // =========================
    // ❤️ SECTION 2 — VITALS
    // =========================
    vitals: {
        bp: String,
        hr: Number,
        spo2: Number,
        temp: Number,
        rr: Number,
        gcs: Number,
        bloodSugar: Number
    },

    // =========================
    // 🧠 SECTION 3 — CONDITION DETAILS (Dynamic)
    // =========================
    conditionDetails: {
        type: Object,
        default: {}
    },

    // =========================
    // 💊 SECTION 4 — ACTIVE MEDICATIONS
    // =========================
    activeMedications: [
        {
            name: { type: String, required: true },
            dose: { type: String, required: true },
            route: { type: String, enum: ["Oral", "IV", "IM"], required: true },
            lastGivenAt: String,
            mustNotStop: { type: Boolean, default: false }
        }
    ],

    // =========================
    // 📝 SECTION 5 — HANDOFF NOTE
    // =========================
    clinicalSummary: {
        type: String,
        maxlength: 150
    },

    pendingInvestigations: [String],

    modeOfTransfer: {
        type: String,
        enum: ["Ambulance", "Air", "Private Vehicle"]
    },

    // =========================
    // 🔗 SHARING
    // =========================
    reportId: String,                 // TR-XXXX
    shareId: { type: String, unique: true },
    qrCode: String,

    // =========================
    // 📊 STATUS
    // =========================
    status: {
        type: String,
        enum: ["draft", "submitted", "acknowledged"],
        default: "draft"
    }

}, { timestamps: true });

const TransferRecord = mongoose.model("TransferRecord", transferRecordSchema);

module.exports = TransferRecord;