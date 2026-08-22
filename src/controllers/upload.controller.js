const fs = require("fs/promises");
const { importPolicies } = require("../services/import.service");

const uploadPolicies = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an XLSX, XLS or CSV file",
      });
    }

    const result = await importPolicies(req.file.path);

    await fs.unlink(req.file.path).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Policy data imported successfully",
      data: result,
    });
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    next(error);
  }
};

module.exports = {
  uploadPolicies,
};