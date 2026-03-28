const express = require("express");
const app = express();
const patientRoutes = require("./routes/patientRoutes.js");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
    res.send("test route is working ");
})

app.use("/api/v1/patients", patientRoutes);

module.exports = app;

