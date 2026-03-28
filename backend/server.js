const express = require("express");
const app = express();
const cors = require("cors");

const patientRoutes = require("./routes/patientRoutes.js");
const transferRoutes = require("./routes/transferRoutes.js");

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

module.exports = app;

