const {
  scheduleMessage,
} = require("../services/scheduler.service");

const createScheduledMessage = async (req, res, next) => {
  try {
    const { message, date, time } = req.body;

    if (!message || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "message, date and time are required",
      });
    }

    const scheduledMessage = await scheduleMessage({
      message,
      date,
      time,
    });

    return res.status(201).json({
      success: true,
      message: "Message scheduled successfully",
      data: scheduledMessage,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createScheduledMessage,
};