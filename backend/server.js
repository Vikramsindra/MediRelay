const express = require("express");
const cors = require("cors");
const app = express();
const patientRoutes = require("./routes/patientRoutes.js");
const transferRoutes = require("./routes/transferRoutes.js");

// Enable CORS for all routes
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
    res.json({ success: true, message: "test route is working" });
});

app.get("/debug/patients-count", async (req, res) => {
    try {
        const Patient = require("./models/PatientModel.js");
        const count = await Patient.countDocuments();
        res.json({ success: true, count, message: `Database has ${count} patients` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/transfers", transferRoutes);

module.exports = app;
