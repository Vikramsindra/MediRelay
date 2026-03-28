const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({

    // Owner (User)
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    // Identity
    fullName: { type: String, required: true },
    abhaRegistration: { type: Boolean, default: false },
    abhaId: {
        type: String,
        trim: true,
        required: function () {
            return this.abhaRegistration === true;
        }
    },
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
            _id: false,
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
            _id: false,
            name: String,
            dose: String,
            route: String,
            frequency: String
        }
    ]

}, { timestamps: true });

patientSchema.index(
    { abhaId: 1 },
    {
        unique: true,
        partialFilterExpression: {
            abhaRegistration: true,
            abhaId: { $type: "string", $ne: "" }
        }
    }
);

const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);

module.exports = Patient;