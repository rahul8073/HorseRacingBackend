const mongoose = require("mongoose");

const LuckyDrawSchema = new mongoose.Schema(
  {
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    winnerName: { type: String, required: true },
    bonusAmount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LuckyDraw", LuckyDrawSchema);
