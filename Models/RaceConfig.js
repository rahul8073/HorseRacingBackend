const mongoose = require("mongoose");

const RaceConfigSchema = new mongoose.Schema(
  {
    phase: {
      type: String,
      enum: ["raceStart", "resultTimer", "waiting"],
      default: "raceStart",
    },
    countdown: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RaceConfig", RaceConfigSchema);
