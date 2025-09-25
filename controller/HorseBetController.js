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
    const allBets = await HorseBet.find()
      .populate("horseId", "_id horseNumber horseName")
      .populate("userId", "_id name walletBalance bonusBalance");

    const allHorses = await Horses.find({}, "_id ID horseName");
    const totalHorses = allHorses.length;

    let winningHorseId = null;
    let winningHorseNumber = null; // changed from customId
    let winningHorseName = null;
    let minAmount = Infinity;
    let winningUsers = [];

    if (allBets.length > 0) {
      const grouped = {};
      allBets.forEach((bet) => {
        const id = bet.horseId._id.toString();
        if (!grouped[id]) {
          grouped[id] = {
            totalAmount: 0,
            horseName: bet.horseId.horseName,
            horseNumber: bet.horseId.horseNumber, // horse number
          };
        }
        grouped[id].totalAmount += bet.Amount;
      });

      const betHorseIds = Object.keys(grouped);

      // Case 1: All horses have bets → pick horse with smallest total bet
      if (betHorseIds.length === totalHorses) {
        for (let horseId in grouped) {
          if (grouped[horseId].totalAmount < minAmount) {
            minAmount = grouped[horseId].totalAmount;
            winningHorseId = horseId;
            winningHorseNumber = grouped[horseId].horseNumber;
            winningHorseName = grouped[horseId].horseName;
          }
        }

        const usersWhoBet = allBets.filter(bet => bet.horseId._id.toString() === winningHorseId);

        for (const bet of usersWhoBet) {
          const winningAmount = bet.Amount * 10; // 10x payout
          winningUsers.push({
            userId: bet.userId._id,
            name: bet.userId.name,
            betAmount: bet.Amount,
            winningAmount
          });

          // Add winning to walletBalance
          const user = await User.findById(bet.userId._id);
          user.walletBalance += winningAmount;
          await user.save();
        }
      } else {
        // Case 2: Some horses have no bets → pick random zero-bet horse
        const zeroBetHorses = allHorses.filter(h => !betHorseIds.includes(h._id.toString()));
        if (zeroBetHorses.length > 0) {
          const randomHorse = zeroBetHorses[Math.floor(Math.random() * zeroBetHorses.length)];
          winningHorseId = randomHorse._id.toString();
          winningHorseNumber = randomHorse.horseNumber;
          winningHorseName = randomHorse.horseName;
          minAmount = 0;
          winningUsers = [];
        }
      }

      // Save bet history
      const historyData = allBets.map(bet => ({
        userId: bet.userId._id,
        horseId: bet.horseId._id,
        horseNumber: bet.horseId.horseNumber,
        horseName: bet.horseId.horseName,
        betAmount: bet.Amount,
        winningAmount: bet.horseId._id.toString() === winningHorseId ? bet.Amount * 10 : 0,
        status: bet.horseId._id.toString() === winningHorseId ? "won" : "lost",
        raceDate: new Date(),
      }));

      if (historyData.length > 0) await BetHistory.insertMany(historyData);

      await HorseBet.deleteMany({});
    } else {
      // Case 3: No bets → pick random horse
      if (allHorses.length > 0) {
        const randomHorse = allHorses[Math.floor(Math.random() * allHorses.length)];
        winningHorseId = randomHorse._id.toString();
        winningHorseNumber = randomHorse.horseNumber;
        winningHorseName = randomHorse.horseName;
        minAmount = 0;
        winningUsers = [];
      }
    }

    res.status(200).json({
      message: "Race result decided successfully",
      winner: {
        horseId: winningHorseId,
        horseNumber: winningHorseNumber,
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
