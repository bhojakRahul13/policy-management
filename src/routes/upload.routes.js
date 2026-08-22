const express = require("express");

const upload = require("../middleware/upload");
const { uploadPolicies } = require("../controllers/upload.controller");

const router = express.Router();

router.post("/", upload.single("file"), uploadPolicies);

module.exports = router;