const express = require("express");
const app = express();
const cors = require("cors");

const patientRoutes = require("./routes/patientRoutes.js");
const transferRoutes = require("./routes/transferRoutes.js");
const userRoutes = require("./routes/userRoutes.js");
const ocrRoutes = require("./routes/ocrRoutes.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "*",
}));

app.get("/test", (req, res) => {
    res.send("test route is working ");
})

app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/transfers", transferRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/ocr", ocrRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({
        success: false,
        message: "Internal server error"
    });
});

module.exports = app;

