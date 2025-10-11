const GAME_START_SECONDS = 30; // raceStart countdown
const WAIT_SECONDS = 60;       // waiting countdown

let phase = "raceStart";
let countdown = GAME_START_SECONDS;

console.log(`🏇 Initial Phase: ${phase}, Countdown: ${countdown}s`);

const startTimer = () => {
  const timer = setInterval(() => {
    console.clear(); // console clear for clean countdown
    console.log(`Phase: ${phase}`);
    console.log(`Countdown: ${countdown}s`);
    if (countdown === 29) {
      phase = "waiting";
    }
    countdown--;

    if (countdown < 0) {
      // Phase switch
      if (phase === "raceStart") {
        phase = "waiting";
        countdown = WAIT_SECONDS;
      } else if (phase === "waiting") {
        phase = "raceStart";
        countdown = GAME_START_SECONDS;
      }
      console.log(`\n🔁 Phase switched to: ${phase}`);
    }
  }, 1000);
};

startTimer();
