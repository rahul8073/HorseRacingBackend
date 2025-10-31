const mongoose = require("mongoose");

const LuckyDrawClaimSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastClaimTime: { type: Date, default: Date.now },
    nextClaimTime: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LuckyDrawClaim", LuckyDrawClaimSchema);
