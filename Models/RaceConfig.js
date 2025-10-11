const mongoose = require("mongoose");

const RaceConfigSchema = new mongoose.Schema({
  endTime: { type: Date, required: true },
  phase: { type: String, enum: ["raceStart", "waiting"], default: "raceStart" },
});

module.exports = mongoose.model("RaceConfig", RaceConfigSchema);
