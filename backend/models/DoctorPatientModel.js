const mongoose = require("mongoose");

/**
 * Patient model — `patients` collection
 * Registered by a doctor. doctorId links the patient to the creating doctor.
 * The PatientModel.js (OTP-based) stays untouched for the patient-facing auth flow.
 */
const doctorPatientSchema = new mongoose.Schema(
    {
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Core identity
        fullName: { type: String, required: true, trim: true },
        age: { type: Number, required: true },
        sex: { type: String, enum: ["M", "F", "Other"], required: true },
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        },
        phone: { type: String, default: null },

        // Emergency contact
        emergencyContact: {
            name: { type: String, default: null },
            phone: { type: String, default: null },
            relation: { type: String, default: null },
        },

        // Allergies
        noKnownAllergies: { type: Boolean, default: false },
        allergies: [
            {
                _id: false,
                allergen: { type: String },
                reaction: { type: String },
            },
        ],

        // Chronic conditions
        chronicConditions: [{ type: String }],

        // Permanent medications
        noRegularMedications: { type: Boolean, default: false },
        permanentMedications: [
            {
                _id: false,
                name: { type: String },
                dose: { type: String },
                route: { type: String },
                frequency: { type: String },
            },
        ],
    },
    { timestamps: true }
);

// Compound text index for search
doctorPatientSchema.index({ doctorId: 1, createdAt: -1 });
doctorPatientSchema.index({ fullName: "text" });

const DoctorPatient = mongoose.model("DoctorPatient", doctorPatientSchema, "patients");

module.exports = DoctorPatient;
