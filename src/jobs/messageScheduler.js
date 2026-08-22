const cron = require("node-cron");
const {
  processScheduledMessages,
} = require("../services/scheduler.service");

const startMessageScheduler = () => {
  console.log("Message scheduler started");

  const task = cron.schedule(
    "* * * * *",
    async () => {
      try {
        await processScheduledMessages();
      } catch (error) {
        console.error(
          "Message scheduler error:",
          error.message
        );
      }
    },
    {
      timezone: process.env.TIMEZONE || "Asia/Kolkata",
    }
  );

  return task;
};

module.exports = {
  startMessageScheduler,
};