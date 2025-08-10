const HorseBet = require("../Models/HorseBet");
const BetHistory = require("../Models/BetHistory");
const Horses = require("../Models/Horses");

// Create a new bet using Horse.ID from request
exports.CreateHorseBet = async (req, res) => {
    try {
        const { horseID, Amount } = req.body;
        const userId = req.user._id;

        if (!userId || !horseID || Amount == null) {
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
            Amount: Number(Amount)
        });

        await newBet.save();

        res.status(201).json({
            message: "Bet created successfully",
            bet: newBet,
            horse: {
                _id: horse._id,
                ID: horse.ID,
                horseName: horse.horseName
            }
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

        const bets = await HorseBet.find({ userId })
            .populate('horseId', 'ID horseName') // fetch horse info
            .select('horseId Amount betTime status');

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
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $lookup: {
                    from: "horses", // matches Mongo collection name
                    localField: "horseId",
                    foreignField: "_id",
                    as: "horseDetails"
                }
            },
            { $unwind: "$horseDetails" },
            {
                $group: {
                    _id: "$horseDetails.horseName",
                    bets: {
                        $push: {
                            userName: "$userDetails.name",
                            amount: "$Amount"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    horseName: "$_id",
                    bets: 1
                }
            }
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
        const userId = req.user._id;
        console.log(userId)
        const bets = await BetHistory.find({ userId })
            .populate('userId', 'name email')
            .populate('horseId', 'ID horseName')
            .sort({ createdAt: -1 });

        if (!bets.length) {
            return res.status(404).json({ message: "No bets found for this user" });
        }

        res.status(200).json({
            message: "User bet history fetched successfully",
            bets
        });

    } catch (error) {
        console.error("Error fetching bet history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.DecideRaceResult = async (req, res) => {
    try {
        // 1. Get all horses
        const allHorses = await Horses.find();

        // 2. Get all bets
        const allBets = await HorseBet.find().populate('horseId', 'ID horseName');

        // 3. Group bets by horseId
        const grouped = {};
        allHorses.forEach(horse => {
            grouped[horse._id.toString()] = {
                totalAmount: 0,
                horseName: horse.horseName
            };
        });

        allBets.forEach(bet => {
            const id = bet.horseId._id.toString();
            grouped[id].totalAmount += bet.Amount;
        });

        // 4. Find horse with smallest total bet (including zero)
        let winningHorseId = null;
        let minAmount = Infinity;
        for (let horseId in grouped) {
            if (grouped[horseId].totalAmount < minAmount) {
                minAmount = grouped[horseId].totalAmount;
                winningHorseId = horseId;
            }
        }

        const winningHorseName = grouped[winningHorseId].horseName;

        // 5. Prepare bet history entries
        const historyData = allBets.map(bet => ({
            userId: bet.userId,
            horseId: bet.horseId._id,
            horseName: bet.horseId.horseName,
            Amount: bet.Amount,
            status: bet.horseId._id.toString() === winningHorseId ? "won" : "lost",
            raceDate: new Date()
        }));

        // 6. Save to BetHistory
        if (historyData.length > 0) {
            await BetHistory.insertMany(historyData);
        }

        // 7. Clear bets
        await HorseBet.deleteMany({});

        res.status(200).json({
            message: "Race result decided successfully",
            winner: {
                horseId: winningHorseId,
                horseName: winningHorseName,
                totalAmount: minAmount
            }
        });

    } catch (error) {
        console.error("Error deciding race result:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

