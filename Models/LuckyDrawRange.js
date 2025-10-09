const mongoose = require("mongoose");

const LuckyDrawRangeSchema = new mongoose.Schema(
  {
    minAmount: { type: Number, required: true, default: 10 },
    maxAmount: { type: Number, required: true, default: 100 },
    eligibleUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    drawTime: { type: String, required: true }, // Changed to String to store local time format
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
  },
  { collection: "luckyDrawRange" }
);

module.exports = mongoose.model("LuckyDrawRange", LuckyDrawRangeSchema);
