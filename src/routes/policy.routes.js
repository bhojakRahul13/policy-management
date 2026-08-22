const express = require("express");

const {
  searchPolicies,
  aggregatePoliciesByUser,
} = require("../controllers/policy.controller");

const router = express.Router();

router.get("/search", searchPolicies);
router.get("/aggregate/users", aggregatePoliciesByUser);

module.exports = router;
