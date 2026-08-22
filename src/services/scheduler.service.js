const ScheduledMessage = require("../models/ScheduledMessage");

const scheduleMessage = async ({ message, date, time }) => {
  const dateTimeString = `${date}T${time}:00`;

  const scheduledAt = new Date(dateTimeString);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Invalid date or time");
  }

  if (scheduledAt <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  return ScheduledMessage.create({
    message: message.trim(),
    scheduledAt,
  });
};

const processScheduledMessages = async () => {
  while (true) {
    const job = await ScheduledMessage.findOneAndUpdate(
      {
        status: "pending",
        scheduledAt: {
          $lte: new Date(),
        },
      },
      {
        $set: {
          status: "processing",
        },
      },
      {
        returnDocument: "after",
        sort: {
          scheduledAt: 1,
        },
      }
    );

    if (!job) {
      break;
    }

    try {
      console.log(`Processing scheduled message: ${job.message}`);

      await ScheduledMessage.updateOne(
        {
          _id: job._id,
          status: "processing",
        },
        {
          $set: {
            status: "completed",
            processedAt: new Date(),
          },
        }
      );
    } catch (error) {
      await ScheduledMessage.updateOne(
        {
          _id: job._id,
          status: "processing",
        },
        {
          $set: {
            status: "failed",
            error: error.message,
          },
        }
      );
    }
  }
};

module.exports = {
  scheduleMessage,
  processScheduledMessages,
};