const path = require("path");
require("dotenv").config();
const mongoose = require("mongoose");

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error(
        " MongoDB connection error: MONGODB_URI is not defined."
        + " Make sure .env is present and contains MONGODB_URI."
    );
    process.exit(1);
}

async function connectToDb() {
    try {
        await mongoose.connect(mongoURI);

        console.log(" MongoDB connected successfully");
    } catch (error) {
        console.error(" MongoDB connection error:", error.message);
        process.exit(1); // exit if DB fails
    }
}
module.exports = connectToDb;