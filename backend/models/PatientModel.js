const crypto = require("crypto");
const mongoose = require("mongoose");

const phoneRegex = /^[6-9]\d{9}$/;

const patientSchema = new mongoose.Schema(
    {
        // Auth / identity fields (new)
        phone: {
            type: String,
            required: true,
            unique: true,
            match: phoneRegex,
            index: true,
        },
        name: { type: String, default: null },
        age: { type: Number, default: null },
        gender: { type: String, enum: ["M", "F", "Other", null], default: null },
        abhaId: { type: String, default: null },

        otp: {
            code: { type: String, select: false, default: null },
            expiresAt: { type: Date, select: false, default: null },
            attempts: { type: Number, select: false, default: 0 },
        },

        isVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },
        refreshToken: { type: String, select: false, default: null },
        transferIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TransferRecord" }],

        // Existing transfer-related fields (kept for compatibility)
        fullName: { type: String },
        sex: { type: String, enum: ["M", "F", "Other"] },
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
        },
        emergencyContact: {
            name: String,
            phone: String,
            relation: String,
        },
        noKnownAllergies: { type: Boolean, default: false },
        allergies: [
            {
                _id: false,
                allergen: String,
                reaction: String,
            },
        ],
        chronicConditions: [String],
        noRegularMedications: { type: Boolean, default: false },
        permanentMedications: [
            {
                _id: false,
                name: String,
                dose: String,
                route: String,
                frequency: String,
            },
        ],
    },
    { timestamps: true }
);

patientSchema.methods.isOTPValid = function isOTPValid(inputCode) {
    if (!inputCode || !this.otp?.code || !this.otp?.expiresAt) return false;
    if (new Date(this.otp.expiresAt).getTime() < Date.now()) return false;

    const hashedInput = crypto.createHash("sha256").update(String(inputCode)).digest("hex");
    return hashedInput === this.otp.code;
};

patientSchema.methods.clearOTP = function clearOTP() {
    this.otp = {
        code: null,
        expiresAt: null,
        attempts: 0,
    };
};

patientSchema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject({ versionKey: false });
    delete obj.refreshToken;
    if (obj.otp) {
        delete obj.otp.code;
        delete obj.otp.expiresAt;
        delete obj.otp.attempts;
    }
    return obj;
};

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;