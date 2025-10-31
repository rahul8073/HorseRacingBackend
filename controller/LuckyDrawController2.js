const LuckyDrawRange = require("../Models/LuckyDrawRange");
const LuckyDraw = require("../Models/LuckyDraw");
const LuckyDrawClaim = require("../Models/LuckyDrawClaim");

// --------------------
// Helper function
// --------------------
function toLocalISOString(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000Z`;
}

// --------------------
// ADMIN: Create Lucky Draw Range
// --------------------
exports.setLuckyDrawRange = async (req, res) => {
  try {
    const { minAmount, maxAmount, eligibleUsers, drawTime } = req.body;
    if (!minAmount || !maxAmount || minAmount > maxAmount)
      return res.status(400).json({ Result: 0, message: "Invalid min or max amount" });
    if (!drawTime)
      return res.status(400).json({ Result: 0, message: "Draw time required" });

    const newRange = new LuckyDrawRange({
      minAmount,
      maxAmount,
      eligibleUsers,
      drawTime: new Date(drawTime),
    });
    await newRange.save();

    res.status(200).json({
      Result: 1,
      message: "Lucky Draw Range created successfully",
      Data: newRange,
    });
  } catch (err) {
    console.error("Error creating LuckyDrawRange:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// ADMIN: Update Lucky Draw Range
// --------------------
exports.updateLuckyDrawRange = async (req, res) => {
  try {
    const { id, minAmount, maxAmount, eligibleUsers, drawTime } = req.body;
    if (!id) return res.status(400).json({ Result: 0, message: "Range ID required" });

    const range = await LuckyDrawRange.findById(id);
    if (!range)
      return res.status(404).json({ Result: 0, message: "Range not found" });

    range.minAmount = minAmount ?? range.minAmount;
    range.maxAmount = maxAmount ?? range.maxAmount;
    range.eligibleUsers = eligibleUsers ?? range.eligibleUsers;
    range.drawTime = drawTime ? new Date(drawTime) : range.drawTime;
    await range.save();

    res.status(200).json({
      Result: 1,
      message: "Lucky Draw Range updated successfully",
      Data: range,
    });
  } catch (err) {
    console.error("Error updating LuckyDrawRange:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// ADMIN: Delete Lucky Draw Range
// --------------------
exports.deleteLuckyDrawRange = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ Result: 0, message: "Range ID required" });

    const range = await LuckyDrawRange.findById(id);
    if (!range)
      return res.status(404).json({ Result: 0, message: "Range not found" });

    await LuckyDrawRange.findByIdAndDelete(id);
    res.status(200).json({ Result: 1, message: "Lucky Draw Range deleted successfully" });
  } catch (err) {
    console.error("Error deleting LuckyDrawRange:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// ADMIN: Get All Lucky Draw Ranges
// --------------------
exports.getAllLuckyDrawRanges = async (req, res) => {
  try {
    const ranges = await LuckyDrawRange.find().sort({ createdAt: -1 });
    res.status(200).json({
      Result: 1,
      message: "All Lucky Draw Ranges fetched successfully",
      Data: ranges,
    });
  } catch (err) {
    console.error("Error fetching LuckyDrawRanges:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// ADMIN: Get All Lucky Draws History
// --------------------
exports.getAllLuckyDraws = async (req, res) => {
  try {
    const draws = await LuckyDraw.find().sort({ createdAt: -1 });
    res.status(200).json({
      Result: 1,
      message: "All Lucky Draw history fetched successfully",
      Data: draws,
    });
  } catch (err) {
    console.error("Error fetching LuckyDraws:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// USER: Claim Lucky Draw (Once in 24 hours)
// --------------------
exports.claimLuckyDraw = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userName = req.user?.name || "User";
    if (!userId)
      return res.status(401).json({ Result: 0, message: "Unauthorized user" });

    // Get latest range
    const latestRange = await LuckyDrawRange.findOne().sort({ drawTime: -1 });
    if (!latestRange)
      return res.status(400).json({ Result: 0, message: "No active draw range found" });

    // Check last claim (24-hour rule)
    const lastClaim = await LuckyDrawClaim.findOne({ userId }).sort({ createdAt: -1 });
    if (lastClaim) {
      const hoursDiff = (new Date() - lastClaim.createdAt) / (1000 * 60 * 60);
      if (hoursDiff < 24)
        return res.status(400).json({
          Result: 0,
          message: `You can claim again after ${Math.ceil(24 - hoursDiff)} hours.`,
        });
    }

    // Generate random bonus amount
    const bonusAmount =
      Math.floor(
        Math.random() *
          (latestRange.maxAmount - latestRange.minAmount + 1)
      ) + latestRange.minAmount;

    // Save claim
    const claim = new LuckyDrawClaim({
      userId,
      userName,
      bonusAmount,
      drawRangeId: latestRange._id,
    });
    await claim.save();

    // Save result to LuckyDraw (winner record)
    const drawRecord = new LuckyDraw({
      winnerId: userId,
      winnerName: userName,
      bonusAmount,
    });
    await drawRecord.save();

    res.status(200).json({
      Result: 1,
      message: "Lucky Draw claimed successfully!",
      bonusAmount,
    });
  } catch (err) {
    console.error("Error claiming LuckyDraw:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// USER: Get User Lucky Draw History
// --------------------
exports.getUserLuckyDrawHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    const history = await LuckyDrawClaim.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({
      Result: 1,
      message: "User Lucky Draw history fetched successfully",
      Data: history,
    });
  } catch (err) {
    console.error("Error fetching user draw history:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// --------------------
// USER: Get Upcoming Lucky Draw
// --------------------
exports.getUpcomingLuckyDraw = async (req, res) => {
  try {
    const now = new Date();
    const upcoming = await LuckyDrawRange.findOne({ drawTime: { $gte: now } }).sort({ drawTime: 1 });
    if (!upcoming)
      return res.status(200).json({ Result: 0, message: "No upcoming draws found" });

    res.status(200).json({
      Result: 1,
      message: "Upcoming Lucky Draw fetched successfully",
      Data: {
        drawTime: toLocalISOString(upcoming.drawTime),
        minAmount: upcoming.minAmount,
        maxAmount: upcoming.maxAmount,
      },
    });
  } catch (err) {
    console.error("Error fetching upcoming LuckyDraw:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

