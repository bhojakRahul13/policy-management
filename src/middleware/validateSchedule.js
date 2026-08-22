const validateSchedule = (req, res, next) => {
  const { message, date, time } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: "message is required",
    });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      success: false,
      message: "date must be in YYYY-MM-DD format",
    });
  }

  if (!time || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return res.status(400).json({
      success: false,
      message: "time must be in HH:mm format",
    });
  }

  next();
};

module.exports = validateSchedule;