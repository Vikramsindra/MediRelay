const mongoose = require("mongoose");

const transferRecordSchema = new mongoose.Schema({

    // =========================
    // 👤 PATIENT DETAILS (Embedded snapshot frozen at transfer time)
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
                _id: false,
                allergen: String,
                reaction: String
            }
        ],

        chronicConditions: [String],

        noRegularMedications: { type: Boolean, default: false },
        permanentMedications: [
            {
                _id: false,
                name: String,
                dose: String,
                route: String,
                frequency: String
            }
        ]
    },

    // =========================
    // 🔗 PATIENT REFERENCE (indexed for history queries)
    // =========================
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorPatient",
        index: true,
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
    // 🧠 SECTION 3 — CONDITION DETAILS (Dynamic per category)
    // conditionDetails fields per category:
    //   Cardiac:     { symptomOnsetTime, ecgDone, ecgFindings, thrombolysisGiven }
    //   Neuro:       { symptomOnsetTime, strokeType, ctDone, ctFindings, seizureActive }
    //   Obstetric:   { gestationalAge, rhFactor, fetalHeartRate, reasonHighRisk }
    //   Respiratory: { oxygenRequired, onVentilator, ventilatorSettings }
    //   Renal:       { urineOutput, onDialysis, lastCreatinine }
    //   Trauma:      { mechanismOfInjury, majorInjuries, surgeryNeeded }
    //   Neonatal:    { gestationalAge, birthWeight, apgarScore, deliveryType }
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
            _id: false,
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
    reportId: String,
    shareId: { type: String, unique: true, sparse: true },
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

const TransferRecord = mongoose.model("TransferRecord", transferRecordSchema, "transferrecords");

module.exports = TransferRecord;