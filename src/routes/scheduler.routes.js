const express = require("express");

const {
  createScheduledMessage,
} = require("../controllers/scheduler.controller");

const validateSchedule = require("../middleware/validateSchedule");

const router = express.Router();

router.post("/schedule", validateSchedule, createScheduledMessage);

module.exports = router;
