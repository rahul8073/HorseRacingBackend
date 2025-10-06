const LuckyDraw = require("../Models/LuckyDraw");
const LuckyDrawRange = require("../Models/LuckyDrawRange");
const User = require("../Models/user");

// --------------------
// Admin: Set min-max range
// --------------------
exports.setLuckyDrawRange = async (req, res) => {
  try {
    const { minAmount, maxAmount } = req.body;
    const userId = req.user?._id; // Assuming your auth middleware adds req.user

    if (!minAmount || !maxAmount || minAmount > maxAmount)
      return res.status(400).json({ message: "Invalid min-max range" });

    let range = await LuckyDrawRange.findOne();
    if (!range) {
      // Create new range and store creator
      range = new LuckyDrawRange({ minAmount, maxAmount, createdBy: userId });
    } else {
      // Update existing range and store updater
      range.minAmount = minAmount;
      range.maxAmount = maxAmount;
      range.updatedBy = userId;
      range.updatedAt = Date.now();
    }

    await range.save();
    res.status(200).json({ message: "Lucky draw range updated", range });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get current range
exports.getLuckyDrawRange = async (req, res) => {
  try {
    const range = await LuckyDrawRange.findOne()
      .populate('createdBy', 'name')   // populate createdBy with user name
      .populate('updatedBy', 'name');  // optional: show updater's name

    if (!range) return res.status(404).json({ message: "No range found" });

    res.status(200).json({
      message: "Lucky draw range fetched",
      Data: range,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Delete range (optional)
exports.deleteLuckyDrawRange = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Range ID is required" });

    const range = await LuckyDrawRange.findById(id);
    if (!range) return res.status(404).json({ message: "Range not found" });

    await LuckyDrawRange.deleteOne({ _id: id });
    res.status(200).json({ message: "Lucky draw range deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// --------------------
// User: Run lucky draw (24 hrs check)
// --------------------
function formatDateTime(date) {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

exports.userLuckyDraw = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Get range
    const range = await LuckyDrawRange.findOne();
    if (!range) {
      return res.status(400).json({ message: "Lucky draw range not set by admin" });
    }

    // Last draw
    const lastDraw = await LuckyDraw.findOne({ winnerId: userId }).sort({ createdAt: -1 });
    const now = new Date();

    if (lastDraw && now - lastDraw.createdAt < 24 * 60 * 60 * 1000) {
      return res.status(400).json({
        message: "Lucky draw already run in last 24 hours",
        lastDrawTime: formatDateTime(lastDraw.createdAt)
      });
    }

    // Random bonus
    const bonusAmount = Math.floor(
      Math.random() * (range.maxAmount - range.minAmount + 1) + range.minAmount
    );

    // Update user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.bonusBalance = Number(user.bonusBalance) + bonusAmount;
    await user.save();

    // Save record
    const luckyDraw = new LuckyDraw({
      winnerId: userId,
      winnerName: user.name,
      bonusAmount,
    });
    await luckyDraw.save();

    res.status(200).json({
      message: "Lucky draw success",
      bonusAmount,
      lastDrawTime: lastDraw ? formatDateTime(lastDraw.createdAt) : null,
      currentDrawTime: formatDateTime(luckyDraw.createdAt)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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

