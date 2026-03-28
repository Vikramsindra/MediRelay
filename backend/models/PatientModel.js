const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({

    // Identity
    fullName: { type: String, required: true },
    age: { type: Number, required: true },
    sex: { type: String, enum: ["M", "F", "Other"], required: true },
    bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
    },
    phone: String,

    // Emergency Contact
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },

    // Allergies
    noKnownAllergies: { type: Boolean, default: false },
    allergies: [
        {
            allergen: String,
            reaction: String
        }
    ],

    // Chronic Conditions
    chronicConditions: [String],

    // Permanent Medications
    noRegularMedications: { type: Boolean, default: false },
    permanentMedications: [
        {
            name: String,
            dose: String,
            route: String,
            frequency: String
        }
    ]

}, { timestamps: true });

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;