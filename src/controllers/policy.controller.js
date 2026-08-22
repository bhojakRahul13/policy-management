const {
  searchPoliciesByUsername,
  getPoliciesByUsers,
} = require("../services/policy.service");

const searchPolicies = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: "username is required",
      });
    }

    const result = await searchPoliciesByUsername(username);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const aggregatePoliciesByUser = async (req, res, next) => {
  try {
    const data = await getPoliciesByUsers();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  searchPolicies,
  aggregatePoliciesByUser,
};
