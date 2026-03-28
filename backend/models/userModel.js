const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  name: String,

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["doctor", "nurse"],
    required: true
  },

  hospital: {
    name: String,
    location: String
  }

}, { timestamps: true });
module.exports = mongoose.model("User", UserSchema);