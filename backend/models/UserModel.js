const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

/**
 * User (Doctor) model — `users` collection
 * After login the frontend stores: doctorId (= _id), name, hospitalName, email
 * No JWT — doctorId IS the session.
 */
const userSchema = new mongoose.Schema(
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
        hospitalName: { type: String, required: true, trim: true },
        password: { type: String, required: true, select: false },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function hashPassword(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(String(candidate || ""), this.password || "");
};

userSchema.methods.toSafeObject = function toSafeObject() {
    const obj = this.toObject({ versionKey: false });
    delete obj.password;
    return obj;
};

const User = mongoose.model("User", userSchema, "users");

module.exports = User;
