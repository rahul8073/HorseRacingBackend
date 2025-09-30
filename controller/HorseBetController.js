const HorseBet = require("../Models/HorseBet");
const BetHistory = require("../Models/BetHistory");
const Horses = require("../Models/Horses");
const User = require("../Models/user");

exports.CreateHorseBet = async (req, res) => {
  try {
    const { horseNumber, Amount } = req.body; // ✅ use horseNumber instead of horseID
    const userId = req.user?._id;

    // Rule 0: Authentication
    if (!userId) return res.status(401).json({ message: "Unauthorized: User not logged in" });

    // Rule 1: Validate input
    if (!horseNumber || Amount == null || Amount <= 0)
      return res.status(400).json({ message: "All fields are required and amount must be positive" });

    // Fetch user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch horse by horseNumber
    const horse = await Horses.findOne({ horseNumber });
    if (!horse) return res.status(404).json({ message: "Horse not found" });

    // Rule 2: Deduct from bonusBalance first, then walletBalance
    let remainingAmount = Amount;

    if (user.bonusBalance >= remainingAmount) {
      user.bonusBalance -= remainingAmount;
      remainingAmount = 0;
    } else {
      remainingAmount -= user.bonusBalance;
      user.bonusBalance = 0;

      if (user.walletBalance < remainingAmount) {
        return res.status(400).json({ message: "Insufficient funds (bonus + wallet)" });
      }
      user.walletBalance -= remainingAmount;
      remainingAmount = 0;
    }

    await user.save();

    // Rule 3: Create the bet
    const newBet = new HorseBet({
      userId,
      horseId: horse._id,
      Amount: Number(Amount),
    });
    await newBet.save();

    res.status(200).json({
      message: "Bet created successfully",
      bet: newBet,
      user: {
        walletBalance: user.walletBalance,
        bonusBalance: user.bonusBalance,
      },
      horse: {
        _id: horse._id,
        horseNumber: horse.horseNumber,
        horseName: horse.horseName,
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
    if (!userId) return res.status(401).json({ message: "Unauthorized: User not logged in" });

    const bets = await HorseBet.find({ userId })
      .populate("horseId", "ID horseName")
      .select("horseId Amount betTime status");

    res.status(200).json(bets);
  } catch (error) {
    console.error("Error fetching bets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.GetHorseTotalBet = async (req, res) => {
  try {
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

      // Group by horse name
      {
        $group: {
          _id: "$horseDetails.horseName",
          bets: {
            $push: {
              userName: "$userDetails.name",
              amount: "$Amount",
              status: "$status",
              placedAt: "$createdAt",
            },
          },
        },
      },

      // Project final structure
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




exports.BetHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized: User not logged in" });

    const bets = await BetHistory.find({ userId })
      .populate("userId", "name email")
      .populate("horseId", "ID horseName")
      .sort({ createdAt: -1 });

    if (!bets.length) return res.status(404).json({ message: "No bets found for this user" });

    res.status(200).json({ message: "User bet history fetched successfully", bets });
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
    res.status(500).json({ Result: 0, Data: { message: "Internal server error" } });
  }
};

exports.DecideRaceResult = async (req, res) => {
  try {
    const { totalHorses } = req.params; // 12 ya 22

    // ✅ Step 1: params validate
    if (!["12", "22"].includes(totalHorses)) {
      return res.status(400).json({
        message: "Invalid totalHorses param, only 12 or 22 allowed",
      });
    }

    const horseLimit = parseInt(totalHorses, 10);
    const payoutMultiplier = horseLimit === 12 ? 10 : 20;

    // ✅ Step 2: sirf selected range ke horses lo
    let allHorses = await Horses.find({}, "_id horseName horseNumber");

    allHorses = allHorses
      .filter(h => h.horseNumber >= 1 && h.horseNumber <= horseLimit)
      .sort((a, b) => a.horseNumber - b.horseNumber);

    if (allHorses.length !== horseLimit) {
      return res.status(400).json({
        message: `Race requires ${horseLimit} horses, found ${allHorses.length}`,
      });
    }

    // ✅ Step 3: bets fetch karo
    const allBets = await HorseBet.find()
      .populate("horseId", "_id horseNumber horseName")
      .populate("userId", "_id name walletBalance bonusBalance");

    // 🚨 Null horseId / userId वाले bets ignore karo
    const validBets = allBets.filter(
      bet => bet.horseId !== null && bet.userId !== null
    );

    let winningHorse = null;

    // ✅ Step 4: check karo ki sab horses pe bet hai ya nahi
    const horsesWithBets = new Set(validBets.map(bet => bet.horseId.horseNumber));
    const horsesWithoutBets = allHorses.filter(
      h => !horsesWithBets.has(h.horseNumber)
    );

    if (horsesWithoutBets.length > 0) {
      // Agar koi horse pe bet nahi hai → unme se random winner choose karo
      winningHorse =
        horsesWithoutBets[Math.floor(Math.random() * horsesWithoutBets.length)];
    } else {
      // Sab horses pe bet hai → lowest bet wale horse ko winner choose karo
      const betTotals = {};
      validBets.forEach(bet => {
        betTotals[bet.horseId.horseNumber] =
          (betTotals[bet.horseId.horseNumber] || 0) + bet.Amount;
      });

      const minBetHorseNumber = Object.keys(betTotals).reduce((a, b) =>
        betTotals[a] < betTotals[b] ? a : b
      );

      winningHorse = allHorses.find(
        h => h.horseNumber === Number(minBetHorseNumber)
      );
    }

    // ✅ Step 5: payout distribute karo
    let winningUsers = [];
    for (const bet of validBets) {
      if (bet.horseId.horseNumber === winningHorse.horseNumber) {
        const winningAmount = bet.Amount * payoutMultiplier;
        winningUsers.push({
          userId: bet.userId._id,
          name: bet.userId.name,
          betAmount: bet.Amount,
          winningAmount,
        });

        // user wallet update
        const user = await User.findById(bet.userId._id);
        if (user) {
          user.walletBalance += winningAmount;
          await user.save();
        }
      }
    }

    // ✅ Step 6: bet history save karo
    const historyData = validBets.map(bet => ({
      userId: bet.userId._id,
      horseId: bet.horseId._id,
      horseNumber: bet.horseId.horseNumber,
      horseName: bet.horseId.horseName,
      betAmount: bet.Amount,
      winningAmount:
        bet.horseId.horseNumber === winningHorse.horseNumber
          ? bet.Amount * payoutMultiplier
          : 0,
      status:
        bet.horseId.horseNumber === winningHorse.horseNumber ? "won" : "lost",
      raceDate: new Date(),
    }));

    if (historyData.length > 0) await BetHistory.insertMany(historyData);

    // ✅ Step 7: clear current bets
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





