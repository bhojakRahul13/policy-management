require("dotenv").config();

const express = require("express");

const uploadRoutes = require("./src/routes/upload.routes");
const policyRoutes = require("./src/routes/policy.routes");
const schedulerRoutes = require("./src/routes/scheduler.routes");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api/upload", uploadRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/messages", schedulerRoutes);

// Keep this LAST
app.use(errorHandler);

module.exports = app;