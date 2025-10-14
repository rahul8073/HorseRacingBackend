const GAME_START_SECONDS = 30; // raceStart countdown
const WAIT_SECONDS = 60;       // waiting countdown

let phase = "raceStart";
let phase1countdown = GAME_START_SECONDS;
let phase2countdown = WAIT_SECONDS;

console.log(`🏇 Initial Phase: ${phase}, Countdown: ${phase1countdown}s`);

const startTimer = () => {
  const timer = setInterval(() => {
    console.clear();

    if (phase1countdown > 0) {
      // RaceStart phase
      console.log(`Phase: ${phase}`);
      console.log(`Countdown: ${phase1countdown}s`);

      // Important 29 logic: phase name changes but timer continues
      if (phase === "raceStart" && phase1countdown === 29) {
        phase = "waiting";
        console.log("⚡ Phase name changed to 'waiting' at 29s!");
      }

      phase1countdown--;

      // When countdown ends, start waiting timer
      if (phase1countdown === 0) {
        phase2countdown = WAIT_SECONDS;
        console.log(`\n🔁 RaceStart finished, waiting timer will start now`);
      }

    } else if (phase1countdown === 0 && phase2countdown > 0) {
      // Waiting phase countdown
      console.log(`Phase: ${phase}`);
      console.log(`Countdown: ${phase2countdown}s`);
      phase2countdown--;

      if (phase2countdown === 0) {
        phase = "raceStart";
        phase1countdown = GAME_START_SECONDS;
        console.log(`\n🔁 Waiting finished, raceStart will restart`);
      }
    }

  }, 1000);
};

startTimer();
