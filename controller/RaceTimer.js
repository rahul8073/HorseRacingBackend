const { DecideRaceResult } = require("./HorseBetController");

// 🕒 Phase durations
const RACE_START_SECONDS = 30;
const RESULT_SECONDS = 30;
const WAIT_SECONDS = 10;

// 🧠 Local State (no MongoDB)
let currentPhase = "raceStart";
let countdown = RACE_START_SECONDS;
let lastRaceResult = null;
let resultDecided = false;
let phaseInterval = null;
let isTransitioning = false;

// =============================
// 🏇 Initialize Race Timer
// =============================
(function initRaceTimer() {
  console.log("🏇 Race timer initialized → raceStart");
  startPhaseLoop();
})();

// =============================
// 🔁 Phase Loop Controller
// =============================
function startPhaseLoop() {
  clearInterval(phaseInterval);
  console.log(`▶️ Phase started: ${currentPhase} (${countdown}s)`);

  phaseInterval = setInterval(async () => {
    try {
      if (isTransitioning) return;

      countdown--;

      // 🏆 Auto Decide Result (only once)
      if (
        currentPhase === "resultTimer" &&
        countdown === 22 &&
        !resultDecided
      ) {
        console.log("⚙️ Automatically deciding race result (countdown=22)...");
        resultDecided = true;
        try {
          const result = await DecideRaceResult(12); // race type or mode
          lastRaceResult = result;
          console.log("✅ Race result decided:", result?.winner?.horseName);
        } catch (err) {
          console.error("❌ DecideRaceResult error:", err);
        }
      }

      // --- Phase Switch Logic ---
      if (countdown <= 0 && !isTransitioning) {
        isTransitioning = true;
        clearInterval(phaseInterval);

        if (currentPhase === "raceStart") {
          currentPhase = "resultTimer";
          countdown = RESULT_SECONDS;
          resultDecided = false;
          console.log("🏁 Race ended → Result phase started");
        } else if (currentPhase === "resultTimer") {
          currentPhase = "waiting";
          countdown = WAIT_SECONDS;
          console.log("✅ Result phase ended → Waiting started");
        } else if (currentPhase === "waiting") {
          currentPhase = "raceStart";
          countdown = RACE_START_SECONDS;
          lastRaceResult = null;
          resultDecided = false;
          console.log("🔁 Waiting ended → New Race started");
        }

        isTransitioning = false;
        startPhaseLoop(); // restart new phase cleanly
      }
    } catch (err) {
      console.error("❌ Loop error:", err);
    }
  }, 1000);
}

// =============================
// 📡 Race Timer API
// =============================
exports.getRaceTimer = async (req, res) => {
  try {
    return res.json({
      Result: 1,
      phase: currentPhase,
      countdown,
      raceResult:
        currentPhase === "resultTimer"
          ? lastRaceResult
          : null,
    });
  } catch (err) {
    console.error("❌ API error:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};
