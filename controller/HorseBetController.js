const HorseBet = require("../Models/HorseBet");
const BetHistory = require("../Models/BetHistory");
const Horses = require("../Models/Horses");
const User = require("../Models/user");
const HorseWin = require("../Models/HorseWin");

// exports.CreateHorseBet = async (req, res) => {
//   try {
//     const { horseNumber, Amount } = req.body; // ✅ use horseNumber instead of horseID
//     const userId = req.user?._id;

//     // Rule 0: Authentication
//     if (!userId) return res.status(401).json({ message: "Unauthorized: User not logged in" });

//     // Rule 1: Validate input
//     if (!horseNumber || Amount == null || Amount <= 0)
//       return res.status(400).json({ message: "All fields are required and amount must be positive" });

//     // Fetch user
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Fetch horse by horseNumber
//     const horse = await Horses.findOne({ horseNumber });
//     if (!horse) return res.status(404).json({ message: "Horse not found" });

//     // Rule 2: Deduct from bonusBalance first, then walletBalance
//     let remainingAmount = Amount;

//     if (user.bonusBalance >= remainingAmount) {
//       user.bonusBalance -= remainingAmount;
//       remainingAmount = 0;
//     } else {
//       remainingAmount -= user.bonusBalance;
//       user.bonusBalance = 0;

//       if (user.walletBalance < remainingAmount) {
//         return res.status(400).json({ message: "Insufficient funds (bonus + wallet)" });
//       }
//       user.walletBalance -= remainingAmount;
//       remainingAmount = 0;
//     }

//     await user.save();

//     // Rule 3: Create the bet
//     const newBet = new HorseBet({
//       userId,
//       horseId: horse._id,
//       Amount: Number(Amount),
//     });
//     await newBet.save();

//     res.status(200).json({
//       message: "Bet created successfully",
//       bet: newBet,
//       user: {
//         walletBalance: user.walletBalance,
//         bonusBalance: user.bonusBalance,
//       },
//       horse: {
//         _id: horse._id,
//         horseNumber: horse.horseNumber,
//         horseName: horse.horseName,
//       },
//     });
//   } catch (error) {
//     console.error("Error creating bet:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.CreateHorseBet = async (req, res) => {
//   try {
//     const userId = req.user?._id;
//     if (!userId)
//       return res.status(401).json({ message: "Unauthorized: User not logged in" });

//     const { horseNumber, Amount, bets } = req.body;

//     // --- Case 1: Multiple Bets ---
//     let betsToPlace = [];
//     if (Array.isArray(bets) && bets.length > 0) {
//       betsToPlace = bets;
//     } else if (horseNumber && Amount) {
//       // --- Case 2: Single Bet ---
//       betsToPlace = [{ horseNumber, Amount }];
//     } else {
//       return res.status(400).json({ message: "Invalid bet data" });
//     }

//     // Fetch user
//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Total required balance
//     let totalAmount = betsToPlace.reduce((sum, b) => sum + Number(b.Amount || 0), 0);
//     if (totalAmount <= 0) {
//       return res.status(400).json({ message: "Bet amount must be positive" });
//     }

//     // Deduct balances (bonus first, then wallet)
//     let remaining = totalAmount;
//     if (user.bonusBalance >= remaining) {
//       user.bonusBalance -= remaining;
//       remaining = 0;
//     } else {
//       remaining -= user.bonusBalance;
//       user.bonusBalance = 0;

//       if (user.walletBalance < remaining) {
//         return res.status(400).json({ message: "Insufficient funds (bonus + wallet)" });
//       }
//       user.walletBalance -= remaining;
//       remaining = 0;
//     }

//     await user.save();

//     // Create all bets
//     let placedBets = [];
//     for (const b of betsToPlace) {
//       if (!b.horseNumber || !b.Amount || b.Amount <= 0) continue;

//       const horse = await Horses.findOne({ horseNumber: b.horseNumber });
//       if (!horse) continue;

//       const newBet = new HorseBet({
//         userId,
//         horseId: horse._id,
//         Amount: Number(b.Amount),
//       });
//       await newBet.save();

//       placedBets.push({
//         _id: newBet._id,
//         Amount: newBet.Amount,
//         horse: {
//           _id: horse._id,
//           horseNumber: horse.horseNumber,
//           horseName: horse.horseName,
//         },
//       });
//     }

//     res.status(200).json({
//       message: "Bets placed successfully",
//       bets: placedBets,
//       user: {
//         walletBalance: user.walletBalance,
//         bonusBalance: user.bonusBalance,
//       },
//     });
//   } catch (error) {
//     console.error("Error creating bet:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.CreateHorseBet = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res
        .status(401)
        .json({ message: "Unauthorized: User not logged in" });

    const { horseNumber, Amount, bets } = req.body;

    // --- Case 1: Multiple Bets ---
    let betsToPlace = [];
    if (Array.isArray(bets) && bets.length > 0) {
      betsToPlace = bets;
    } else if (horseNumber && Amount) {
      // --- Case 2: Single Bet ---
      betsToPlace = [{ horseNumber, Amount }];
    } else {
      return res.status(400).json({ message: "Invalid bet data" });
    }

    // Fetch user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Total required balance
    let totalAmount = betsToPlace.reduce(
      (sum, b) => sum + Number(b.Amount || 0),
      0
    );
    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Bet amount must be positive" });
    }

    // Deduct balances (bonus first, then wallet)
    let remaining = totalAmount;
    if (user.bonusBalance >= remaining) {
      user.bonusBalance -= remaining;
      remaining = 0;
    } else {
      remaining -= user.bonusBalance;
      user.bonusBalance = 0;

      if (user.walletBalance < remaining) {
        return res
          .status(400)
          .json({ message: "Insufficient funds (bonus + wallet)" });
      }
      user.walletBalance -= remaining;
      remaining = 0;
    }

    await user.save();

    // ✅ Create or Update bets
    let placedBets = [];
    for (const b of betsToPlace) {
      if (!b.horseNumber || !b.Amount || b.Amount <= 0) continue;

      const horse = await Horses.findOne({ horseNumber: b.horseNumber });
      if (!horse) continue;

      // --- Check if same user already bet on this horse ---
      let existingBet = await HorseBet.findOne({ userId, horseId: horse._id });

      if (existingBet) {
        // update existing bet amount
        existingBet.Amount += Number(b.Amount);
        await existingBet.save();

        placedBets.push({
          _id: existingBet._id,
          Amount: existingBet.Amount,
          horse: {
            _id: horse._id,
            horseNumber: horse.horseNumber,
            horseName: horse.horseName,
          },
        });
      } else {
        // create new bet
        const newBet = new HorseBet({
          userId,
          horseId: horse._id,
          Amount: Number(b.Amount),
        });
        await newBet.save();

        placedBets.push({
          _id: newBet._id,
          Amount: newBet.Amount,
          horse: {
            _id: horse._id,
            horseNumber: horse.horseNumber,
            horseName: horse.horseName,
          },
        });
      }
    }

    res.status(200).json({
      message: "Bets placed successfully",
      bets: placedBets,
      user: {
        walletBalance: user.walletBalance,
        bonusBalance: user.bonusBalance,
      },
    });
  } catch (error) {
    console.error("Error creating bet:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.GetHorseBets = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res
        .status(401)
        .json({ message: "Unauthorized: User not logged in" });

    const bets = await HorseBet.find({ userId })
      .populate("horseId", "ID horseName")
      .select("horseId Amount betTime status");

    res.status(200).json(bets);
  } catch (error) {
    console.error("Error fetching bets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// exports.GetHorseTotalBet = async (req, res) => {
//   try {
//     const bets = await HorseBet.aggregate([
//       // Join with users
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "userDetails",
//         },
//       },
//       { $unwind: "$userDetails" },

//       // Join with horses
//       {
//         $lookup: {
//           from: "horses",
//           localField: "horseId",
//           foreignField: "_id",
//           as: "horseDetails",
//         },
//       },
//       { $unwind: "$horseDetails" },

//       // Group by horse name
//       {
//         $group: {
//           _id: "$horseDetails.horseName",
//           bets: {
//             $push: {
//               userName: "$userDetails.name",
//               amount: "$Amount",
//               status: "$status",
//               placedAt: "$createdAt",
//             },
//           },
//         },
//       },

//       // Project final structure
//       {
//         $project: {
//           _id: 0,
//           horseName: "$_id",
//           bets: 1,
//         },
//       },
//     ]);

//     res.status(200).json(bets);
//   } catch (error) {
//     console.error("Error fetching total bets:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

exports.GetHorseTotalBet = async (req, res) => {
  try {
    // Step 1: Get current winning number
    const winRecord = await HorseWin.findOne().sort({ createdAt: -1 });
    const winningNumber = winRecord?.horseNumberToWin || 0;

    // Step 2: Determine payoutMultiplier
    const totalHorsesCount = await Horses.countDocuments({ isActive: true });
    const payoutMultiplier = totalHorsesCount === 22 ? 20 : 10;

    const bets = await HorseBet.aggregate([
      // Join with users
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },

      // Join with horses
      {
        $lookup: {
          from: "horses",
          localField: "horseId",
          foreignField: "_id",
          as: "horseDetails",
        },
      },
      { $unwind: "$horseDetails" },

      // Only active horses
      { $match: { "horseDetails.isActive": true } },

      // Group by horse
      {
        $group: {
          _id: "$horseDetails.horseName",
          horseNumber: { $first: "$horseDetails.horseNumber" },
          users: {
            $push: {
              userName: "$userDetails.name",
              betAmount: "$Amount",
              status: "$status",
              placedAt: "$createdAt",
              isWinner: { $eq: ["$horseDetails.horseNumber", winningNumber] },
            },
          },
          totalBetAmount: { $sum: "$Amount" }, // total bet per horse
        },
      },

      // Add totalWinningAmount per horse
      {
        $addFields: {
          totalWinningAmount: { $multiply: ["$totalBetAmount", payoutMultiplier] },
        },
      },

      // Project final fields
      {
        $project: {
          _id: 0,
          horseName: "$_id",
          horseNumber: 1,
          horsewin: { $literal: winningNumber },
          totalBetAmount: 1,
          totalWinningAmount: 1,
          users: 1,
        },
      },

      // Sort by horse number
      { $sort: { horseNumber: 1 } },
    ]);

    res.status(200).json({
      payoutMultiplier,
      totalHorses: totalHorsesCount,
      winningNumber,
      bets,
    });
  } catch (error) {
    console.error("Error fetching total bets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





exports.BetHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId)
      return res
        .status(401)
        .json({ message: "Unauthorized: User not logged in" });

    const bets = await BetHistory.find({ userId })
      .populate("userId", "name email")
      .populate("horseId", "ID horseName")
      .sort({ createdAt: -1 });

    if (!bets.length)
      return res.status(404).json({ message: "No bets found for this user" });

    res
      .status(200)
      .json({ message: "User bet history fetched successfully", bets });
  } catch (error) {
    console.error("Error fetching bet history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all bets (admin)
exports.GetAllBets = async (req, res) => {
  try {
    const bets = await BetHistory.find()
      .populate("userId", "name email")
      .populate("horseId", "ID horseName")
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      Data: bets,
      message: "All bets fetched successfully",
    });
  } catch (err) {
    console.error("Error fetching all bets:", err);
    res
      .status(500)
      .json({ Result: 0, Data: { message: "Internal server error" } });
  }
};

// exports.DecideRaceResult = async (req, res) => {
//   try {
//     const { totalHorses } = req.params; // 12 ya 22

//     // ✅ Step 1: params validate
//     if (!["12", "22"].includes(totalHorses)) {
//       return res.status(400).json({
//         message: "Invalid totalHorses param, only 12 or 22 allowed",
//       });
//     }

//     const horseLimit = parseInt(totalHorses, 10);
//     const payoutMultiplier = horseLimit === 12 ? 10 : 20;

//     // ✅ Step 2: sirf selected range ke horses lo
//     let allHorses = await Horses.find({}, "_id horseName horseNumber");

//     allHorses = allHorses
//       .filter(h => h.horseNumber >= 1 && h.horseNumber <= horseLimit)
//       .sort((a, b) => a.horseNumber - b.horseNumber);

//     if (allHorses.length !== horseLimit) {
//       return res.status(400).json({
//         message: `Race requires ${horseLimit} horses, found ${allHorses.length}`,
//       });
//     }

//     // ✅ Step 3: bets fetch karo
//     const allBets = await HorseBet.find()
//       .populate("horseId", "_id horseNumber horseName")
//       .populate("userId", "_id name walletBalance bonusBalance");

//     // 🚨 Null horseId / userId वाले bets ignore karo
//     const validBets = allBets.filter(
//       bet => bet.horseId !== null && bet.userId !== null
//     );

//     let winningHorse = null;

//     // ✅ Step 4: check karo ki sab horses pe bet hai ya nahi
//     const horsesWithBets = new Set(validBets.map(bet => bet.horseId.horseNumber));
//     const horsesWithoutBets = allHorses.filter(
//       h => !horsesWithBets.has(h.horseNumber)
//     );

//     if (horsesWithoutBets.length > 0) {
//       // Agar koi horse pe bet nahi hai → unme se random winner choose karo
//       winningHorse =
//         horsesWithoutBets[Math.floor(Math.random() * horsesWithoutBets.length)];
//     } else {
//       // Sab horses pe bet hai → lowest bet wale horse ko winner choose karo
//       const betTotals = {};
//       validBets.forEach(bet => {
//         betTotals[bet.horseId.horseNumber] =
//           (betTotals[bet.horseId.horseNumber] || 0) + bet.Amount;
//       });

//       const minBetHorseNumber = Object.keys(betTotals).reduce((a, b) =>
//         betTotals[a] < betTotals[b] ? a : b
//       );

//       winningHorse = allHorses.find(
//         h => h.horseNumber === minBetHorseNumber
//       );
//       // console.log("winningHorse: ", minBetHorseNumber,winningHorse);
//     }

//     // ✅ Step 5: payout distribute karo
//     let winningUsers = [];
//     for (const bet of validBets) {
//       if (bet.horseId.horseNumber === winningHorse.horseNumber) {
//         const winningAmount = bet.Amount * payoutMultiplier;
//         winningUsers.push({
//           userId: bet.userId._id,
//           name: bet.userId.name,
//           betAmount: bet.Amount,
//           winningAmount,
//         });

//         // user wallet update
//         const user = await User.findById(bet.userId._id);
//         if (user) {
//           user.walletBalance += winningAmount;
//           await user.save();
//         }
//       }
//     }

//     // ✅ Step 6: bet history save karo
//     const historyData = validBets.map(bet => ({
//       userId: bet.userId._id,
//       horseId: bet.horseId._id,
//       horseNumber: bet.horseId.horseNumber,
//       horseName: bet.horseId.horseName,
//       betAmount: bet.Amount,
//       winningAmount:
//         bet.horseId.horseNumber === winningHorse.horseNumber
//           ? bet.Amount * payoutMultiplier
//           : 0,
//       status:
//         bet.horseId.horseNumber === winningHorse.horseNumber ? "won" : "lost",
//       raceDate: new Date(),
//     }));

//     if (historyData.length > 0) await BetHistory.insertMany(historyData);

//     // ✅ Step 7: clear current bets
//     await HorseBet.deleteMany({});

//     res.status(200).json({
//       message: "Race result decided successfully",
//       totalHorses: horseLimit,
//       payoutMultiplier,
//       winner: {
//         horseId: winningHorse._id,
//         horseNumber: winningHorse.horseNumber,
//         horseName: winningHorse.horseName,
//         users: winningUsers,
//       },
//     });
//   } catch (error) {
//     console.error("Error deciding race result:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.DecideRaceResult = async (req, res) => {
//   try {
//     const { totalHorses } = req.params; // 12 ya 22

//     // ✅ Step 1: params validate
//     if (!["12", "22"].includes(totalHorses)) {
//       return res.status(400).json({
//         message: "Invalid totalHorses param, only 12 or 22 allowed",
//       });
//     }

//     const horseLimit = parseInt(totalHorses, 10);
//     const payoutMultiplier = horseLimit === 12 ? 10 : 20;

//     // ✅ Step 2: sirf selected range ke horses lo
//     let allHorses = await Horses.find({}, "_id horseName horseNumber");
//     allHorses = allHorses
//       .filter(h => h.horseNumber >= 1 && h.horseNumber <= horseLimit)
//       .sort((a, b) => a.horseNumber - b.horseNumber);

//     if (allHorses.length !== horseLimit) {
//       return res.status(400).json({
//         message: `Race requires ${horseLimit} horses, found ${allHorses.length}`,
//       });
//     }

//     // ✅ Step 3: bets fetch karo
//     const allBets = await HorseBet.find()
//       .populate("horseId", "_id horseNumber horseName")
//       .populate("userId", "_id name walletBalance bonusBalance");

//     const validBets = allBets.filter(
//       bet => bet.horseId !== null && bet.userId !== null
//     );

//     let winningHorse = null;
//     let winningBet = null;

//     // ✅ Step 4: horsesWithBets nikaalo
//     const horsesWithBets = new Set(validBets.map(bet => bet.horseId.horseNumber));
//     const horsesWithoutBets = allHorses.filter(
//       h => !horsesWithBets.has(h.horseNumber)
//     );

//     if (horsesWithBets.size === 0) {
//       // 👉 Case 1: koi bhi bet nahi hai → random horse winner
//       winningHorse = allHorses[Math.floor(Math.random() * allHorses.length)];
//     } else if (horsesWithBets.size === 1) {
//       // 👉 Case 2: sirf ek horse pe bet laga hai → un horses me se random jinke paas bet nahi hai
//       if (horsesWithoutBets.length > 0) {
//         winningHorse =
//           horsesWithoutBets[Math.floor(Math.random() * horsesWithoutBets.length)];
//       } else {
//         // fallback: agar sab horses pe bet laga hai (rare case)
//         const sameHorseBets = validBets.filter(
//           bet => bet.horseId.horseNumber === [...horsesWithBets][0]
//         );
//         winningBet = sameHorseBets.reduce((min, bet) =>
//           !min || bet.Amount < min.Amount ? bet : min
//           , null);
//         winningHorse = winningBet.horseId;
//       }
//     } else {
//       // 👉 Case 3: multiple horses pe bet lage hain → lowest bet winner
//       winningBet = validBets.reduce((min, bet) =>
//         !min || bet.Amount < min.Amount ? bet : min
//         , null);
//       winningHorse = winningBet.horseId;
//     }

//     // ✅ Step 5: payout distribute karo
//     let winningUsers = [];
//     for (const bet of validBets) {
//       if (winningBet) {
//         // Agar ek specific bet jeeta
//         if (bet._id.toString() === winningBet._id.toString()) {
//           const winningAmount = bet.Amount * payoutMultiplier;
//           winningUsers.push({
//             userId: bet.userId._id,
//             name: bet.userId.name,
//             betAmount: bet.Amount,
//             winningAmount,
//           });

//           const user = await User.findById(bet.userId._id);
//           if (user) {
//             user.walletBalance += winningAmount;
//             await user.save();
//           }
//         }
//       } else {
//         // Agar random horse jeeta (jispe bet nahi tha)
//         if (bet.horseId.horseNumber === winningHorse.horseNumber) {
//           const winningAmount = bet.Amount * payoutMultiplier;
//           winningUsers.push({
//             userId: bet.userId._id,
//             name: bet.userId.name,
//             betAmount: bet.Amount,
//             winningAmount,
//           });

//           const user = await User.findById(bet.userId._id);
//           if (user) {
//             user.walletBalance += winningAmount;
//             await user.save();
//           }
//         }
//       }
//     }

//     // ✅ Step 6: bet history save karo
//     let totalBetAmount = 0;
//     let totalWinningAmount = 0;

//     for (const bet of validBets) {
//       totalBetAmount += bet.Amount;
//       if (winningBet) {
//         // agar ek specific bet jeeta
//         if (bet._id.toString() === winningBet._id.toString()) {
//           totalWinningAmount += bet.Amount * payoutMultiplier;
//         }
//       } else {
//         // random horse jeeta
//         if (bet.horseId.horseNumber === winningHorse.horseNumber) {
//           totalWinningAmount += bet.Amount * payoutMultiplier;
//         }
//       }
//     }

//     // ✅ mode decide karo
//     const raceMode = totalBetAmount < totalWinningAmount ? "High" : "Low";

//     const historyData = validBets.map(bet => ({
//       userId: bet.userId._id,
//       horseId: bet.horseId._id,
//       horseNumber: bet.horseId.horseNumber,
//       horseName: bet.horseId.horseName,
//       betAmount: bet.Amount,
//       winningAmount:
//         winningBet
//           ? bet._id.toString() === winningBet._id.toString()
//             ? bet.Amount * payoutMultiplier
//             : 0
//           : bet.horseId.horseNumber === winningHorse.horseNumber
//             ? bet.Amount * payoutMultiplier
//             : 0,
//       status:
//         winningBet
//           ? bet._id.toString() === winningBet._id.toString()
//             ? "won"
//             : "lost"
//           : bet.horseId.horseNumber === winningHorse.horseNumber
//             ? "won"
//             : "lost",
//       mode: raceMode, // ✅ added here
//       raceDate: new Date(),
//     }));

//     if (historyData.length > 0) await BetHistory.insertMany(historyData);

//     // ✅ Step 7: clear current bets
//     await HorseBet.deleteMany({});

//     res.status(200).json({
//       message: "Race result decided successfully",
//       totalHorses: horseLimit,
//       payoutMultiplier,
//       winner: {
//         horseId: winningHorse._id,
//         horseNumber: winningHorse.horseNumber,
//         horseName: winningHorse.horseName,
//         users: winningUsers,
//       },
//     });
//   } catch (error) {
//     console.error("Error deciding race result:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// exports.DecideRaceResult = async (req, res) => {
//   try {
//     const { totalHorses } = req.params; // 12 or 22

//     // ✅ Step 1: validate param
//     if (!["12", "22"].includes(totalHorses)) {
//       return res.status(400).json({
//         message: "Invalid totalHorses param, only 12 or 22 allowed",
//       });
//     }

//     const horseLimit = parseInt(totalHorses, 10);
//     const payoutMultiplier = horseLimit === 12 ? 10 : 20;

//     // ✅ Step 2: get horses for this race
//     let allHorses = await Horses.find({}, "_id horseName horseNumber");
//     allHorses = allHorses
//       .filter(h => h.horseNumber >= 1 && h.horseNumber <= horseLimit)
//       .sort((a, b) => a.horseNumber - b.horseNumber);

//     if (allHorses.length !== horseLimit) {
//       return res.status(400).json({
//         message: `Race requires ${horseLimit} horses, found ${allHorses.length}`,
//       });
//     }

//     // ✅ Step 3: fetch bets for this race only
//     const allBets = await HorseBet.find()
//       .populate("horseId", "_id horseNumber horseName")
//       .populate("userId", "_id name walletBalance bonusBalance");

//     const validBets = allBets.filter(
//       bet =>
//         bet.horseId !== null &&
//         bet.userId !== null &&
//         bet.horseId.horseNumber >= 1 &&
//         bet.horseId.horseNumber <= horseLimit // ✅ filter by race horses
//     );

//     let winningHorse = null;
//     let winningBet = null;

//     // ✅ Step 4: determine winner
//     const horsesWithBets = new Set(validBets.map(bet => bet.horseId.horseNumber));
//     const horsesWithoutBets = allHorses.filter(
//       h => !horsesWithBets.has(h.horseNumber)
//     );

//     if (horsesWithBets.size === 0) {
//       winningHorse = allHorses[Math.floor(Math.random() * allHorses.length)];
//     } else if (horsesWithBets.size === 1) {
//       if (horsesWithoutBets.length > 0) {
//         winningHorse = horsesWithoutBets[Math.floor(Math.random() * horsesWithoutBets.length)];
//       } else {
//         const sameHorseBets = validBets.filter(
//           bet => bet.horseId.horseNumber === [...horsesWithBets][0]
//         );
//         winningBet = sameHorseBets.reduce((min, bet) =>
//           !min || bet.Amount < min.Amount ? bet : min
//         , null);
//         winningHorse = winningBet.horseId;
//       }
//     } else {
//       winningBet = validBets.reduce((min, bet) =>
//         !min || bet.Amount < min.Amount ? bet : min
//       , null);
//       winningHorse = winningBet.horseId;
//     }

//     // ✅ Step 5: payout distribute
//     let winningUsers = [];
//     for (const bet of validBets) {
//       let isWinner = false;
//       if (winningBet) isWinner = bet._id.toString() === winningBet._id.toString();
//       else isWinner = bet.horseId.horseNumber === winningHorse.horseNumber;

//       if (isWinner) {
//         const winningAmount = bet.Amount * payoutMultiplier;
//         winningUsers.push({
//           userId: bet.userId._id,
//           name: bet.userId.name,
//           betAmount: bet.Amount,
//           winningAmount,
//         });

//         const user = await User.findById(bet.userId._id);
//         if (user) {
//           user.walletBalance += winningAmount;
//           await user.save();
//         }
//       }
//     }

//     // ✅ Step 6: save bet history with mode
//     let totalBetAmount = 0;
//     let totalWinningAmount = 0;

//     for (const bet of validBets) {
//       totalBetAmount += bet.Amount;
//       let winAmount = 0;
//       if (winningBet && bet._id.toString() === winningBet._id.toString()) {
//         winAmount = bet.Amount * payoutMultiplier;
//       } else if (!winningBet && bet.horseId.horseNumber === winningHorse.horseNumber) {
//         winAmount = bet.Amount * payoutMultiplier;
//       }
//       totalWinningAmount += winAmount;
//     }

//     const raceMode = totalBetAmount < totalWinningAmount ? "High" : "Low";

//     const historyData = validBets.map(bet => {
//       const isWinner = bet.horseId.horseNumber === winningHorse.horseNumber;
//       return {
//         userId: bet.userId._id,
//         horseId: bet.horseId._id,
//         horseNumber: bet.horseId.horseNumber,
//         horseName: bet.horseId.horseName,
//         betAmount: bet.Amount,
//         winningAmount: isWinner ? bet.Amount * payoutMultiplier : 0,
//         status: isWinner ? "won" : "lost",
//         mode: raceMode,
//         raceDate: new Date(),
//       };
//     });
// console.log("winning users:",winningUsers);

//     if (historyData.length > 0) await BetHistory.insertMany(historyData);

//     // ✅ Step 7: clear only race bets
//       await HorseBet.deleteMany({});

//     res.status(200).json({
//       message: "Race result decided successfully",
//       totalHorses: horseLimit,
//       payoutMultiplier,
//       winner: {
//         horseId: winningHorse._id,
//         horseNumber: winningHorse.horseNumber,
//         horseName: winningHorse.horseName,
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
    const { totalHorses } = req.params; // 12 or 22

    // Step 1: validate param
    if (!["12", "22"].includes(totalHorses)) {
      return res.status(400).json({
        message: "Invalid totalHorses param, only 12 or 22 allowed",
      });
    }

    const horseLimit = parseInt(totalHorses, 10);
    const payoutMultiplier = horseLimit === 12 ? 10 : 20;

    // Step 2: get all horses for this race
    let allHorses = await Horses.find({}, "_id horseName horseNumber");
    allHorses = allHorses
      .filter((h) => h.horseNumber >= 1 && h.horseNumber <= horseLimit)
      .sort((a, b) => a.horseNumber - b.horseNumber);

    if (allHorses.length !== horseLimit) {
      return res.status(400).json({
        message: `Race requires ${horseLimit} horses, found ${allHorses.length}`,
      });
    }

    // Step 2.5: get latest winning number
    const winRecord = await HorseWin.findOne().sort({ createdAt: -1 });
    let winningNumber = winRecord?.horseNumberToWin || 0;

    // Step 3: fetch bets for this race
    const allBets = await HorseBet.find()
      .populate("horseId", "_id horseNumber horseName")
      .populate("userId", "_id name walletBalance bonusBalance");

    const validBets = allBets.filter(
      (bet) =>
        bet.horseId &&
        bet.userId &&
        bet.horseId.horseNumber >= 1 &&
        bet.horseId.horseNumber <= horseLimit
    );

    let winningHorse = null;
    let winningBet = null;

    // Step 4: determine winner
    if (winningNumber > 0) {
      // Use winning number from HorseWin
      winningHorse = allHorses.find((h) => h.horseNumber === winningNumber);
      if (!winningHorse) {
        return res
          .status(400)
          .json({ message: "Winning horse number invalid" });
      }
      // Reset winning number for next race
      winRecord.horseNumberToWin = 0;
      await winRecord.save();
    } else {
      // Existing logic if no winningNumber set
      const horsesWithBets = new Set(
        validBets.map((bet) => bet.horseId.horseNumber)
      );
      const horsesWithoutBets = allHorses.filter(
        (h) => !horsesWithBets.has(h.horseNumber)
      );

      if (horsesWithBets.size === 0) {
        winningHorse = allHorses[Math.floor(Math.random() * allHorses.length)];
      } else if (horsesWithBets.size === 1) {
        if (horsesWithoutBets.length > 0) {
          winningHorse =
            horsesWithoutBets[
              Math.floor(Math.random() * horsesWithoutBets.length)
            ];
        } else {
          const sameHorseBets = validBets.filter(
            (bet) => bet.horseId.horseNumber === [...horsesWithBets][0]
          );
          winningBet = sameHorseBets.reduce(
            (min, bet) => (!min || bet.Amount < min.Amount ? bet : min),
            null
          );
          winningHorse = winningBet.horseId;
        }
      } else {
        winningBet = validBets.reduce(
          (min, bet) => (!min || bet.Amount < min.Amount ? bet : min),
          null
        );
        winningHorse = winningBet.horseId;
      }
    }

    // Step 5: distribute payouts and update user wallets
    const winningUsers = [];
    for (const bet of validBets) {
      let isWinner = false;
      if (winningBet) {
        isWinner = bet._id.toString() === winningBet._id.toString();
      } else {
        isWinner = bet.horseId.horseNumber === winningHorse.horseNumber;
      }

      if (isWinner) {
        const winningAmount = bet.Amount * payoutMultiplier;
        winningUsers.push({
          userId: bet.userId._id,
          name: bet.userId.name,
          betAmount: bet.Amount,
          winningAmount,
        });

        const user = await User.findById(bet.userId._id);
        if (user) {
          user.walletBalance += winningAmount;
          await user.save();
        }
      }
    }

    // Step 6: save bet history
    let totalBetAmount = 0;
    let totalWinningAmount = 0;

    for (const bet of validBets) {
      totalBetAmount += bet.Amount;
      let winAmount = 0;
      if (winningBet && bet._id.toString() === winningBet._id.toString()) {
        winAmount = bet.Amount * payoutMultiplier;
      } else if (
        !winningBet &&
        bet.horseId.horseNumber === winningHorse.horseNumber
      ) {
        winAmount = bet.Amount * payoutMultiplier;
      }
      totalWinningAmount += winAmount;
    }

    const raceMode = totalBetAmount < totalWinningAmount ? "High" : "Low";

    const historyData = validBets.map((bet) => {
      const isWinner = bet.horseId.horseNumber === winningHorse.horseNumber;
      return {
        userId: bet.userId._id,
        horseId: bet.horseId._id,
        horseNumber: bet.horseId.horseNumber,
        horseName: bet.horseId.horseName,
        betAmount: bet.Amount,
        winningAmount: isWinner ? bet.Amount * payoutMultiplier : 0,
        status: isWinner ? "won" : "lost",
        mode: raceMode,
        raceDate: new Date(),
      };
    });

    if (historyData.length > 0) {
      await BetHistory.insertMany(historyData);
    }

    // Step 7: clear all race bets
    await HorseBet.deleteMany({});

    res.status(200).json({
      message: "Race result decided successfully",
      totalHorses: horseLimit,
      payoutMultiplier,
      winner: {
        horseId: winningHorse._id,
        horseNumber: winningHorse.horseNumber,
        horseName: winningHorse.horseName,
        users: winningUsers,
      },
    });
  } catch (error) {
    console.error("Error deciding race result:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin sets a winning horse number for the race
exports.AdminSetWinHorse = async (req, res) => {
  try {
    const { horseNumber } = req.body;

    if (!horseNumber || horseNumber < 0) {
      return res.status(400).json({ message: "Valid horseNumber is required" });
    }

    // ✅ Upsert: update existing record or create new if none exists
    const winRecord = await HorseWin.findOneAndUpdate(
      {}, // no filter, assume single record
      { horseNumberToWin: horseNumber },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      message: `Admin has set horse number ${horseNumber>0?horseNumber:"Auto"} as the winning horse.`,
      winRecord,
    });
  } catch (error) {
    console.error("Error setting winning horse:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
