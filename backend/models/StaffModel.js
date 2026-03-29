const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: ["doctor", "nurse"], required: true },

        hospitalName: { type: String, default: null },
        specialization: { type: String, default: null },
        phone: { type: String, default: null },

        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },
        refreshToken: { type: String, select: false, default: null },
    },
    { timestamps: true }
);

staffSchema.pre("save", async function hashPassword() {
    if (!this.isModified("password")) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 12);
});

staffSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    return bcrypt.compare(String(candidatePassword || ""), this.password || "");
};

staffSchema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject({ versionKey: false });
    delete obj.password;
    delete obj.refreshToken;
    return obj;
};

const Staff = mongoose.model("Staff", staffSchema);

module.exports = Staff;
