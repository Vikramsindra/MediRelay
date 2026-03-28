const express = require("express");
const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/transfers", require("./routes/transferRoutes"));

module.exports = app;

