const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    agencyId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

agentSchema.index({ name: 1, agencyId: 1 }, { unique: true });

module.exports = mongoose.model("Agent", agentSchema);