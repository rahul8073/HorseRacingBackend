const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["deposit", "withdraw", "bonus"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    gateway: { type: String, enum: ["razorpay", "manual", "system"], default: "manual" },
    referenceId: { type: String }, // Razorpay payment ID or manual reference
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
