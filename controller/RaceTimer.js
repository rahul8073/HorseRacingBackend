const RaceConfig = require("../Models/RaceConfig");
const { DecideRaceResult } = require("./HorseBetController");

// Phase durations (in seconds)
const RACE_START_SECONDS = 30;  // 🏇 Race duration
const RESULT_SECONDS = 35;      // 🏆 Result timer
const WAIT_SECONDS = 10;        // ⏳ Waiting before next race

let currentPhase = "raceStart";
let countdown = RACE_START_SECONDS;

// =============================
// 🏇 Initialize Race Timer
// =============================
(async function initRaceTimer() {
  try {
    let config = await RaceConfig.findOne();

    if (!config) {
      config = new RaceConfig({
        phase: "raceStart",
        countdown: RACE_START_SECONDS,
      });
      await config.save();
      console.log("🏇 Race timer initialized → raceStart");
    } else {
      // Always start from raceStart on server restart
      currentPhase = "raceStart";
      countdown = RACE_START_SECONDS;
      await RaceConfig.updateOne({}, { phase: currentPhase, countdown });
      console.log("♻️ Race phase reset → raceStart (server restart)");
    }

    startRacePhase(); // begin the loop

  } catch (err) {
    console.error("Error initializing race timer:", err);
  }
})();

// =============================
// 🏇 Race Start (30s)
// =============================
function startRacePhase() {
  currentPhase = "raceStart";
  countdown = RACE_START_SECONDS;
  console.log("🏁 Race Start phase begins (30s)!");

  const interval = setInterval(async () => {
    countdown--;
    await RaceConfig.updateOne({}, { phase: currentPhase, countdown });

    if (countdown <= 0) {
      clearInterval(interval);
      console.log("🏁 Race finished → switching to Result Timer...");
      startResultPhase();
    }
  }, 1000);
}

// =============================
// 🏆 Result Timer (35s)
// =============================
function startResultPhase() {
  currentPhase = "resultTimer";
  countdown = RESULT_SECONDS;
  console.log("🕒 Result Timer started (35s)");

  const interval = setInterval(async () => {
    countdown--;
    await RaceConfig.updateOne({}, { phase: currentPhase, countdown });

    if (countdown <= 0) {
      clearInterval(interval);
      console.log("✅ Result Timer finished → switching to Waiting phase...");
      startWaitingPhase();
    }
  }, 1000);
}

// =============================
// ⏳ Waiting Phase (10s)
// =============================
function startWaitingPhase() {
  currentPhase = "waiting";
  countdown = WAIT_SECONDS;
  console.log("⏳ Waiting phase started (10s)");

  const interval = setInterval(async () => {
    countdown--;
    await RaceConfig.updateOne({}, { phase: currentPhase, countdown });

    if (countdown <= 0) {
      clearInterval(interval);
      console.log("🔁 Waiting finished → restarting Race...");
      startRacePhase();
    }
  }, 1000);
}

// =============================
// 🌐 API: Get Race Timer
// =============================
// exports.getRaceTimer = async (req, res) => {
//   try {
//     const config = await RaceConfig.findOne();
//     if (!config)
//       return res.status(400).json({ Result: 0, message: "Timer not initialized" });

//     res.json({
//       Result: 1,
//       phase: config.phase,
//       countdown: config.countdown,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ Result: 0, message: "Internal server error" });
//   }
// };

let lastRaceResult = null;
exports.getRaceTimer = async (req, res) => {
  try {
    const config = await RaceConfig.findOne();
    if (!config)
      return res.status(400).json({ Result: 0, message: "Timer not initialized" });

    // 🏁 If phase is "resultTimer", decide result once per race
    if (config.phase === "resultTimer" && config.countdown==22) {
      console.log("⚙️ Deciding race result via API call...");
      try {
        const result = await DecideRaceResult(12); // or pass 22 for 22-horse mode
        lastRaceResult = result;
        console.log("✅ Race result decided:", result?.winner?.horseName);
      } catch (err) {
        console.error("❌ Error deciding race result:", err);
      }
    }

    // 🧭 Reset after waiting phase (start new race)
    if (config.phase === "raceStart" && lastRaceResult) {
      lastRaceResult = null;
    }

    // 🧩 Return result (even during raceStart or waiting)
    return res.json({
      Result: 1,
      phase: config.phase,
      countdown: config.countdown,
      raceResult: lastRaceResult || null,
    });
  } catch (err) {
    console.error("Error fetching race timer:", err);
    return res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};