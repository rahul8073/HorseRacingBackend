const LuckyDraw = require("../Models/LuckyDraw");
const LuckyDrawRange = require("../Models/LuckyDrawRange");
const User = require("../Models/user");

// --------------------
// Admin: Set min-max range, eligible users, draw time
// --------------------
exports.setLuckyDrawRange = async (req, res) => {
  try {
    const { minAmount, maxAmount, eligibleUsers, drawTime } = req.body;
    const userId = req.user?._id;

    if (!minAmount || !maxAmount || minAmount > maxAmount) {
      return res.status(400).json({ Result: 0, message: "Invalid min-max range" });
    }
    if (!drawTime) {
      return res.status(400).json({ Result: 0, message: "Draw time required" });
    }

    // ✅ Always create a new range (allow multiple ranges)
    const newRange = new LuckyDrawRange({
      minAmount,
      maxAmount,
      eligibleUsers,
      drawTime: new Date(drawTime),
      createdBy: userId,
    });

    await newRange.save();

    res.status(200).json({
      Result: 1,
      message: "Lucky draw range created successfully",
      Data: newRange,
    });
  } catch (error) {
    console.error("Error creating lucky draw range:", error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};


// --------------------
// Get current range
// --------------------
exports.getLuckyDrawRange = async (req, res) => {
  try {
    const range = await LuckyDrawRange.find()
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .populate("eligibleUsers", "name email"); // ✅ populate eligibleUsers

    if (!range) 
      return res.status(404).json({ Result: 0, message: "No range found" });

    res.status(200).json({ 
      Result: 1, 
      message: "Lucky draw range fetched", 
      Data: range 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};


// --------------------
// Delete range
// --------------------
exports.deleteLuckyDrawRange = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ Result: 0, message: "Range ID is required" });

    const range = await LuckyDrawRange.findById(id);
    if (!range) return res.status(404).json({ Result: 0, message: "Range not found" });

    await LuckyDrawRange.deleteOne({ _id: id });
    res.status(200).json({ Result: 1, message: "Lucky draw range deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// User: Run lucky draw
// --------------------
exports.userLuckyDraw = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const range = await LuckyDrawRange.findOne();
    if (!range) return res.status(400).json({ message: "Lucky draw range not set" });

    // Check eligibility
    if (!range.eligibleUsers.includes(userId)) {
      return res.status(403).json({ message: "You are not eligible for this draw" });
    }

    const now = new Date();
    if (now < range.drawTime) {
      return res.status(400).json({
        message: `Lucky draw will be available at ${range.drawTime.toLocaleString()}`,
      });
    }

    // Optional: check if already claimed for this draw time
    const lastDraw = await LuckyDraw.findOne({
      winnerId: userId,
      createdAt: { $gte: range.drawTime },
    });
    if (lastDraw) {
      return res.status(400).json({ message: "Lucky draw already claimed for this round" });
    }

    // Random bonus
    const bonusAmount = Math.floor(Math.random() * (range.maxAmount - range.minAmount + 1) + range.minAmount);

    // Update user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.bonusBalance += bonusAmount;
    await user.save();

    // Save lucky draw record
    const luckyDraw = new LuckyDraw({
      winnerId: userId,
      winnerName: user.name,
      bonusAmount,
    });
    await luckyDraw.save();

    res.status(200).json({
      Result: 1,
      message: "Lucky draw success",
      bonusAmount,
      currentDrawTime: luckyDraw.createdAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// User: Get own history
// --------------------
exports.getUserLuckyDrawHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    const history = await LuckyDraw.find({ winnerId: userId }).sort({ createdAt: -1 });
    res.status(200).json({ Result: 1, Data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// Admin: Get all lucky draw history
// --------------------
exports.getAllLuckyDraws = async (req, res) => {
  try {
    const draws = await LuckyDraw.find()
      .populate("winnerId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ Result: 1, Data: draws });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};
