const os = require("os");
const { exec } = require("child_process");

const CPU_THRESHOLD = Number(process.env.CPU_THRESHOLD || 70);
const CPU_CHECK_INTERVAL = Number(process.env.CPU_CHECK_INTERVAL || 5000);

// Require high CPU for 2 consecutive checks before restart.
const HIGH_CPU_CHECKS_REQUIRED = 2;

// Prevent immediate repeated restarts.
const RESTART_COOLDOWN = 30000;

let previousCpuUsage = process.cpuUsage();
let previousTime = process.hrtime.bigint();

let highCpuChecks = 0;
let lastRestartTime = 0;

const calculateCpuUsage = () => {
  const currentCpuUsage = process.cpuUsage(previousCpuUsage);
  const currentTime = process.hrtime.bigint();

  const elapsedMicroseconds = Number(
    (currentTime - previousTime) / 1000n
  );

  previousCpuUsage = process.cpuUsage();
  previousTime = currentTime;

  if (elapsedMicroseconds <= 0) {
    return 0;
  }

  const totalCpuMicroseconds =
    currentCpuUsage.user + currentCpuUsage.system;

  const cpuCount = os.cpus().length;

  const usage =
    (totalCpuMicroseconds / (elapsedMicroseconds * cpuCount)) * 100;

  return Math.min(100, Math.max(0, usage));
};

const restartServer = () => {
  const now = Date.now();

  if (now - lastRestartTime < RESTART_COOLDOWN) {
    console.log(
      "CPU threshold reached, but restart is on cooldown."
    );
    return;
  }

  lastRestartTime = now;

  console.warn(
    `CPU usage exceeded ${CPU_THRESHOLD}%. Restarting application with PM2...`
  );

  exec("pm2 restart policy-management", (error, stdout, stderr) => {
    if (error) {
      console.error("PM2 restart failed:", error.message);
      return;
    }

    if (stderr) {
      console.error("PM2 stderr:", stderr);
    }

    console.log("PM2 restart output:", stdout);
  });
};

const startCpuMonitor = () => {
  console.log(
    `CPU monitor started. Threshold=${CPU_THRESHOLD}%, interval=${CPU_CHECK_INTERVAL}ms`
  );

  const timer = setInterval(() => {
    const cpuUsage = calculateCpuUsage();

    console.log(
      `Current process CPU usage: ${cpuUsage.toFixed(2)}%`
    );

    if (cpuUsage >= CPU_THRESHOLD) {
      highCpuChecks += 1;

      console.warn(
        `High CPU detected: ${highCpuChecks}/${HIGH_CPU_CHECKS_REQUIRED}`
      );

      if (highCpuChecks >= HIGH_CPU_CHECKS_REQUIRED) {
        highCpuChecks = 0;
        restartServer();
      }
    } else {
      highCpuChecks = 0;
    }
  }, CPU_CHECK_INTERVAL);

  timer.unref();

  return timer;
};

module.exports = {
  startCpuMonitor,
};