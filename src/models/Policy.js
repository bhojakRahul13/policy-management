const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      required: true,
      trim: true,
    },

    policyMode: {
      type: Number,
      default: null,
    },

    producer: {
      type: String,
      trim: true,
      default: null,
    },

    premiumAmountWritten: {
      type: Number,
      default: null,
    },

    premiumAmount: {
      type: Number,
      default: null,
    },

    policyType: {
      type: String,
      trim: true,
      default: null,
    },

    policyStartDate: {
      type: Date,
      default: null,
    },

    policyEndDate: {
      type: Date,
      default: null,
    },

    csr: {
      type: String,
      trim: true,
      default: null,
    },

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    lobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lob",
      required: true,
    },

    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

policySchema.index({ policyNumber: 1 }, { unique: true });
policySchema.index({ userId: 1 });
policySchema.index({ agentId: 1 });
policySchema.index({ accountId: 1 });
policySchema.index({ lobId: 1 });
policySchema.index({ carrierId: 1 });

module.exports = mongoose.model("Policy", policySchema);