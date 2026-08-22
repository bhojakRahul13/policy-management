const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Multer errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];

    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field || "unique field"}`,
    });
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((error) => error.message),
    });
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}`,
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message:
      err.statusCode && err.message
        ? err.message
        : "Internal server error",
  });
};

module.exports = errorHandler;