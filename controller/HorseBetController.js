const HorseBet = require("../Models/HorseBet");
const BetHistory = require("../Models/BetHistory");
const Horses = require("../Models/Horses");

// Create a new bet using Horse.ID from request
exports.CreateHorseBet = async (req, res) => {
  try {
    const { horseID, Amount } = req.body;
    const userId = req.user?._id;
    if(!userId ){
      return res.status(401).json({ message: "Unauthorized: User not logged in" });
    }

    if (!horseID || Amount == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find horse by custom ID field
    const horse = await Horses.findOne({ ID: horseID });
    if (!horse) {
      return res.status(404).json({ message: "Horse not found" });
    }

    const newBet = new HorseBet({
      userId,
      horseId: horse._id,
      Amount: Number(Amount),
    });

    await newBet.save();

    res.status(201).json({
      message: "Bet created successfully",
      bet: newBet,
      horse: {
        _id: horse._id,
        ID: horse.ID,
        horseName: horse.horseName,
      },
    });
  } catch (error) {
    console.error("Error creating bet:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all bets for logged-in user
exports.GetHorseBets = async (req, res) => {
  try {
    const userId = req.user._id;
 if(!userId ){
      return res.status(401).json({ message: "Unauthorized: User not logged in" });
    }
    const bets = await HorseBet.find({ userId })
      .populate("horseId", "ID horseName") // fetch horse info
      .select("horseId Amount betTime status");

    res.status(200).json(bets);
  } catch (error) {
    console.error("Error fetching bets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get total bets per horse with user details
exports.GetHorseTotalBet = async (req, res) => {
  try {
    const bets = await HorseBet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $lookup: {
          from: "horses", // matches Mongo collection name
          localField: "horseId",
          foreignField: "_id",
          as: "horseDetails",
        },
      },
      { $unwind: "$horseDetails" },
      {
        $group: {
          _id: "$horseDetails.horseName",
          bets: {
            $push: {
              userName: "$userDetails.name",
              amount: "$Amount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          horseName: "$_id",
          bets: 1,
        },
      },
    ]);

    res.status(200).json(bets);
  } catch (error) {
    console.error("Error fetching total bets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get bet history for logged-in user
exports.BetHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if(!userId ){
      return res.status(401).json({ message: "Unauthorized: User not logged in" });
    }
    const bets = await BetHistory.find({ userId })
      .populate("userId", "name email")
      .populate("horseId", "ID horseName")
      .sort({ createdAt: -1 });

    if (!bets.length) {
      return res.status(404).json({ message: "No bets found for this user" });
    }

    res.status(200).json({
      message: "User bet history fetched successfully",
      bets,
    });
  } catch (error) {
    console.error("Error fetching bet history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// exports.DecideRaceResult = async (req, res) => {
//   try {
//     // 1. Get all bets with horse + user info
//     const allBets = await HorseBet.find()
//       .populate("horseId", "ID horseName")
//       .populate("userId", "name");

//     // 2. Group bets by horseId
//     const grouped = {};
//     allBets.forEach((bet) => {
//       const id = bet.horseId._id.toString();
//       if (!grouped[id]) {
//         grouped[id] = { totalAmount: 0, horseName: bet.horseId.horseName };
//       }
//       grouped[id].totalAmount += bet.Amount;
//     });

//     let winningHorseId = null;
//     let winningHorseName = null;
//     let minAmount = 0;
//     let winningUsers = [];

//     if (allBets.length > 0) {
//       // ✅ Case: Bets exist → pick horse with smallest total bet
//       console.log(grouped);
      
//       for (let horseId in grouped) {
//         if (grouped[horseId].totalAmount <= minAmount) {
//           minAmount = grouped[horseId].totalAmount;
//           winningHorseId = horseId;
//         }
//       }

//       winningHorseName = grouped[winningHorseId].horseName;

//       // Find winning users
//       const usersWhoBet = allBets.filter(
//         (bet) => bet.horseId._id.toString() === winningHorseId
//       );

//       winningUsers = usersWhoBet.map((bet) => ({
//         userId: bet.userId._id,
//         name: bet.userId.name,
//         betAmount: bet.Amount,
//         winningAmount: bet.Amount * 10, // 10x payout
//       }));

//       // Save history only if bets exist
//       const historyData = allBets.map((bet) => ({
//         userId: bet.userId._id,
//         horseId: bet.horseId._id,
//         horseName: bet.horseId.horseName,
//         betAmount: bet.Amount,
//         winningAmount:
//           bet.horseId._id.toString() === winningHorseId ? bet.Amount * 10 : 0,
//         status:
//           bet.horseId._id.toString() === winningHorseId ? "won" : "lost",
//         raceDate: new Date(),
//       }));

//       if (historyData.length > 0) {
//         await BetHistory.insertMany(historyData);
//       }

//       await HorseBet.deleteMany({});
//     } else {
//       // ⚠️ Case: No bets at all → pick random horse
//       const allHorses = await Horses.find({}, "horseName");
//       if (allHorses.length > 0) {
//         const randomHorse =
//           allHorses[Math.floor(Math.random() * allHorses.length)];
//         winningHorseId = randomHorse._id.toString();
//         winningHorseName = randomHorse.horseName;
//         minAmount = 0;
//         winningUsers = []; // no one placed bets

//         // 👇 Ensure consistent output
//         winningUsers.push({
//           userId: null,
//           name: null,
//           betAmount: 0,
//           winningAmount: 0,
//         });
//       }
//     }

//     // 3. Respond with race result
//     res.status(200).json({
//       message: "Race result decided successfully",
//       winner: {
//         horseId: winningHorseId,
//         horseName: winningHorseName,
//         totalAmount: minAmount,
//         users: winningUsers,
//       },
//     });
//   } catch (error) {
//     console.error("Error deciding race result:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


exports.DecideRaceResult = async (req, res) => {
  try {
    // 1. Get all bets with horse + user info
    const allBets = await HorseBet.find()
      .populate("horseId", "ID horseName")
      .populate("userId", "name");

    const allHorses = await Horses.find({}, "horseName");
    const totalHorses = allHorses.length;

    let winningHorseId = null;
    let winningHorseName = null;
    let minAmount = Infinity;
    let winningUsers = [];

    if (allBets.length > 0) {
      // Group bets by horse
      const grouped = {};
      allBets.forEach((bet) => {
        const id = bet.horseId._id.toString();
        if (!grouped[id]) {
          grouped[id] = { totalAmount: 0, horseName: bet.horseId.horseName };
        }
        grouped[id].totalAmount += bet.Amount;
      });

      const betHorseIds = Object.keys(grouped);

      // 🟢 Case 1: All horses have bets
      if (betHorseIds.length === totalHorses) {
        for (let horseId in grouped) {
          if (grouped[horseId].totalAmount < minAmount) {
            minAmount = grouped[horseId].totalAmount;
            winningHorseId = horseId;
            winningHorseName = grouped[horseId].horseName;
          }
        }

        // Find winning users
        const usersWhoBet = allBets.filter(
          (bet) => bet.horseId._id.toString() === winningHorseId
        );

        winningUsers = usersWhoBet.map((bet) => ({
          userId: bet.userId._id,
          name: bet.userId.name,
          betAmount: bet.Amount,
          winningAmount: bet.Amount * 10,
        }));
      }
      // 🟢 Case 2: Some horses have no bets → pick random zero-bet horse
      else {
        const zeroBetHorses = allHorses.filter(
          (h) => !betHorseIds.includes(h._id.toString())
        );
        if (zeroBetHorses.length > 0) {
          const randomHorse =
            zeroBetHorses[Math.floor(Math.random() * zeroBetHorses.length)];
          winningHorseId = randomHorse._id.toString();
          winningHorseName = randomHorse.horseName;
          minAmount = 0;
          winningUsers = []; // nobody wins since no bets
        }
      }

      // Save bet history
      const historyData = allBets.map((bet) => ({
        userId: bet.userId._id,
        horseId: bet.horseId._id,
        horseName: bet.horseId.horseName,
        betAmount: bet.Amount,
        winningAmount:
          bet.horseId._id.toString() === winningHorseId ? bet.Amount * 10 : 0,
        status:
          bet.horseId._id.toString() === winningHorseId ? "won" : "lost",
        raceDate: new Date(),
      }));

      if (historyData.length > 0) {
        await BetHistory.insertMany(historyData);
      }

      await HorseBet.deleteMany({});
    } else {
      // 🟢 Case 3: No bets → pick random horse
      if (allHorses.length > 0) {
        const randomHorse =
          allHorses[Math.floor(Math.random() * allHorses.length)];
        winningHorseId = randomHorse._id.toString();
        winningHorseName = randomHorse.horseName;
        minAmount = 0;
        winningUsers = [];
      }
    }

    // 2. Respond with race result
    res.status(200).json({
      message: "Race result decided successfully",
      winner: {
        horseId: winningHorseId,
        horseName: winningHorseName,
        totalAmount: minAmount,
        users: winningUsers,
      },
    });
  } catch (error) {
    console.error("Error deciding race result:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
