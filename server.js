require("dotenv").config();

const app = require("./app");
const mongoose = require("mongoose");

const connectDatabase = require("./src/config/database");
const { startCpuMonitor } = require("./src/jobs/cpuMonitor");
const { startMessageScheduler } = require("./src/jobs/messageScheduler");

const PORT = process.env.PORT || 5000;

let server;
let cpuMonitor;
let messageScheduler;

const startServer = async () => {
  await connectDatabase();

  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    cpuMonitor = startCpuMonitor();
    messageScheduler = startMessageScheduler();
  });
};

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    if (server) {
      server.close(() => {
        console.log("HTTP server closed");
      });
    }

    if (cpuMonitor) {
      clearInterval(cpuMonitor);
      console.log("CPU monitor stopped");
    }

    if (messageScheduler) {
      messageScheduler.stop();
      console.log("Message scheduler stopped");
    }

    await mongoose.connection.close();

    console.log("MongoDB connection closed");
    console.log("Graceful shutdown completed");

    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});

startServer();