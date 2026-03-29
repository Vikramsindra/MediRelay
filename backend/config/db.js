const mongoose = require("mongoose");

const mongoURI = process.env.MONGODB_URI;

async function connectToDb() {
    try {
        await mongoose.connect(mongoURI || "mongodb://127.0.0.1:27017/medirelay");

        console.log(" MongoDB connected successfully");
    } catch (error) {
        console.error(" MongoDB connection error:", error.message);
        process.exit(1); // exit if DB fails
    }
}

module.exports = connectToDb;