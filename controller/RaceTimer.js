const RaceConfig = require("../Models/RaceConfig");

const GAME_START_SECONDS = 31; // frontend countdown
const WAIT_SECONDS = 60;       // frontend waiting

// Auto-init and cycle
(async function initRaceTimer() {
  try {
    let config = await RaceConfig.findOne();

    if (!config) {
      config = new RaceConfig({ phase: "raceStart" });
      await config.save();
      console.log("🏇 Race timer initialized: raceStart");
    }

    let countdown = GAME_START_SECONDS;

    const timerLoop = setInterval(async () => {
      config = await RaceConfig.findOne();
      if (!config) return;

      // === IMPORTANT: countdown === 29 switch logic ===
      if (config.phase === "raceStart" && countdown === 29) {
        config.phase = "waiting";
        countdown = WAIT_SECONDS; // start waiting countdown
        await config.save();
        console.log("🔁 Phase switched to: waiting at countdown 29");
      } else {
        countdown--;
      }

      // Normal countdown end
      if (countdown < 0) {
        if (config.phase === "waiting") {
          config.phase = "raceStart";
          countdown = GAME_START_SECONDS;
          await config.save();
          console.log("🔁 Phase switched to: raceStart");
        } else if (config.phase === "raceStart") {
          config.phase = "waiting";
          countdown = WAIT_SECONDS;
          await config.save();
          console.log("🔁 Phase switched to: waiting");
        }
      }
      console.log("Count",countdown);
      
    }, 1000);

  } catch (err) {
    console.error("Error initializing race timer:", err);
  }
})();

// API for frontend
exports.getRaceTimer = async (req, res) => {
  try {
    const config = await RaceConfig.findOne();
    if (!config) return res.status(400).json({ message: "Timer not initialized" });

    res.json({ phase: config.phase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
