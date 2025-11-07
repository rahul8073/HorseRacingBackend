const RaceConfig = require("../Models/RaceConfig");
const { DecideRaceResult } = require("./HorseBetController");

// 🕒 Phase durations (seconds)
const RACE_START_SECONDS = 30;
const RESULT_SECONDS = 35;
const WAIT_SECONDS = 10;

let currentPhase = "raceStart";
let countdown = RACE_START_SECONDS;
let phaseInterval = null;

let lastRaceResult = null;
let resultDecided = false;

// =============================
// 🏇 Initialize Race Timer
// =============================
(async function initRaceTimer() {
  try {
    let config = await RaceConfig.findOne();

    if (!config) {
      config = new RaceConfig({
        phase: currentPhase,
        countdown,
      });
      await config.save();
      console.log("🏇 Race timer initialized → raceStart");
    } else {
      currentPhase = "raceStart";
      countdown = RACE_START_SECONDS;
      await RaceConfig.updateOne({}, { phase: currentPhase, countdown });
      console.log("♻️ Phase reset → raceStart (server restart)");
    }

    startPhaseLoop();
  } catch (err) {
    console.error("❌ Error initializing race timer:", err);
  }
})();

// =============================
// 🔁 Main Unified Phase Loop
// =============================
function startPhaseLoop() {
  clearInterval(phaseInterval);
  console.log(`▶️ Phase started: ${currentPhase} (${countdown}s)`);

  phaseInterval = setInterval(async () => {
    countdown--;

    // ✅ Sync DB
    await RaceConfig.updateOne({}, { phase: currentPhase, countdown });

    // 🏇 Race Phase → ends
    if (currentPhase === "raceStart" && countdown <= 0) {
      currentPhase = "resultTimer";
      countdown = RESULT_SECONDS;
      resultDecided = false;
      console.log("🏁 Race finished → Result Timer started");
      return;
    }

    // 🧮 Auto Decide Result when countdown == 22
    if (currentPhase === "resultTimer" && countdown === 22 && !resultDecided) {
      console.log("⚙️ Automatically deciding race result (countdown=22)...");
      try {
        const result = await DecideRaceResult(12); // 12 = race type or mode
        lastRaceResult = result;
        resultDecided = true;
        console.log("🏆 Race result decided:", result?.winner?.horseName);
      } catch (err) {
        console.error("❌ Error deciding race result:", err);
      }
    }

    // ⏳ Result Timer → Waiting
    if (currentPhase === "resultTimer" && countdown <= 0) {
      currentPhase = "waiting";
      countdown = WAIT_SECONDS;
      console.log("✅ Result Timer finished → Waiting phase started");
      return;
    }

    // 🔁 Waiting → New Race
    if (currentPhase === "waiting" && countdown <= 0) {
      currentPhase = "raceStart";
      countdown = RACE_START_SECONDS;
      lastRaceResult = null;
      resultDecided = false;
      console.log("🔁 Waiting finished → New Race started");
      return;
    }
  }, 1000);
}

// =============================
// 📡 Race Timer API
// =============================
exports.getRaceTimer = async (req, res) => {
  try {
    const config = await RaceConfig.findOne();
    if (!config)
      return res.status(400).json({ Result: 0, message: "Timer not initialized" });

    return res.json({
      Result: 1,
      phase: config.phase,
      countdown: config.countdown,
      raceResult:
        config.phase === "resultTimer" || config.phase === "waiting"
          ? lastRaceResult
          : null,
    });
  } catch (err) {
    console.error("❌ Error fetching race timer:", err);
    return res
      .status(500)
      .json({ Result: 0, message: "Internal server error" });
  }
};
