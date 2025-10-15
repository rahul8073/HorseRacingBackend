const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["upi", "bank"], required: true },
    accountDetails: {
      account_number: { type: String },
      ifsc: { type: String },
      bank_name: { type: String },
      account_holder_name: { type: String },
      upi_id: { type: String },
    },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
