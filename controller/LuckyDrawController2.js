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
    const userId = req.user?._id;

    if (!minAmount || !maxAmount || minAmount > maxAmount) {
      return res.status(400).json({ Result: 0, message: "Invalid min-max range" });
    }
    if (!drawTime) {
      return res.status(400).json({ Result: 0, message: "Draw time required" });
    }

    const newRange = new LuckyDrawRange({
      minAmount,
      maxAmount,
      eligibleUsers,
      drawTime:drawTime,
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
// ADMIN: Update Lucky Draw Range
// --------------------
// --------------------
// ADMIN: Update Lucky Draw Range (with claim cleanup)
// --------------------
exports.updateLuckyDrawRange = async (req, res) => {
  try {
    const { id, minAmount, maxAmount, eligibleUsers, drawTime } = req.body;
    const userId = req.user?._id;

    if (!id) {
      return res.status(400).json({ Result: 0, message: "Range ID is required" });
    }

    if (!minAmount || !maxAmount || minAmount > maxAmount) {
      return res.status(400).json({ Result: 0, message: "Invalid min-max range" });
    }

    if (!drawTime) {
      return res.status(400).json({ Result: 0, message: "Draw time required" });
    }

    const luckyDrawRange = await LuckyDrawRange.findById(id);
    if (!luckyDrawRange) {
      return res.status(404).json({ Result: 0, message: "Range not found" });
    }

    // console.log("Parsed drawTime:",luckyDrawRange.drawTime);
    // Update fields
    luckyDrawRange.minAmount = minAmount;
    luckyDrawRange.maxAmount = maxAmount;
    luckyDrawRange.eligibleUsers = eligibleUsers;
    luckyDrawRange.drawTime = drawTime; // ✅ exact local time
    luckyDrawRange.updatedBy = userId;
    luckyDrawRange.updatedAt = new Date();
    // console.log("Parsed drawTime:",luckyDrawRange.drawTime);
    await luckyDrawRange.save();
   if (eligibleUsers && Array.isArray(eligibleUsers)) {
      const removedClaims = await LuckyDrawClaim.deleteMany({
        drawRangeId: range._id,
        userId: { $nin: eligibleUsers },
      });

      console.log(`🧹 ${removedClaims.deletedCount} claim(s) removed for ineligible users`);
    }
    // Format drawTime for response
    const drawTimeFormatted = luckyDrawRange.drawTime.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    res.status(200).json({
      Result: 1,
      message: "Lucky draw range updated successfully",
      Data: {
        ...luckyDrawRange.toObject(),
        drawTime: drawTimeFormatted,
      },
    });
  } catch (error) {
    console.error("Error updating lucky draw range:", error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};
// --------------------
// ADMIN: Delete Lucky Draw Range (with related claim cleanup)
// --------------------
exports.deleteLuckyDrawRange = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ Result: 0, message: "Range ID required" });

    const range = await LuckyDrawRange.findById(id);
    if (!range)
      return res.status(404).json({ Result: 0, message: "Range not found" });

    // 🧹 Delete all claims linked to this draw range
    const deletedClaims = await LuckyDrawClaim.deleteMany({ drawRangeId: id });

    // 🗑️ Delete the lucky draw range itself
    await LuckyDrawRange.findByIdAndDelete(id);

    res.status(200).json({
      Result: 1,
      message: `Lucky Draw Range deleted successfully. ${deletedClaims.deletedCount} related claim(s) removed.`,
    });
  } catch (err) {
    console.error("Error deleting LuckyDrawRange:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};


// --------------------
// ADMIN: Get All Lucky Draw Ranges
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

    const latestRange = await LuckyDrawRange.findOne().sort({ drawTime: -1 });
    if (!latestRange)
      return res.status(400).json({ Result: 0, message: "No active draw range found" });

    const lastClaim = await LuckyDrawClaim.findOne({ userId }).sort({ createdAt: -1 });
    if (lastClaim) {
      const hoursDiff = (new Date() - lastClaim.createdAt) / (1000 * 60 * 60);
      if (hoursDiff < 24)
        return res.status(400).json({
          Result: 0,
          message: `You can claim again after ${Math.ceil(24 - hoursDiff)} hours.`,
        });
    }

    const bonusAmount =
      Math.floor(
        Math.random() * (latestRange.maxAmount - latestRange.minAmount + 1)
      ) + latestRange.minAmount;

    const claim = new LuckyDrawClaim({
      userId,
      userName,
      bonusAmount,
      drawRangeId: latestRange._id,
      nextClaimTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // ✅ FIXED
    });
    await claim.save();

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
    const userId = req.user?._id;
    console.log("🔹 API Called: getUpcomingLuckyDraw");
    console.log("🧍 User ID:", userId);

    if (!userId)
      return res.status(401).json({ Result: 0, message: "Unauthorized user" });

    const now = new Date();
    console.log("🕒 Current Server Time:", now);

    // 1️⃣ Find upcoming lucky draw where user is included
    const upcomingRange = await LuckyDrawRange.findOne({
      drawTime: { $gte: now },
      eligibleUsers: userId,
    }).sort({ drawTime: 1 });

    console.log("🎯 Upcoming Range Found:", upcomingRange ? true : false);
    if (upcomingRange) {
      console.log({
        drawTime: upcomingRange.drawTime,
        minAmount: upcomingRange.minAmount,
        maxAmount: upcomingRange.maxAmount,
      });
    }

    // ❌ No draw found that includes user
    if (!upcomingRange) {
      console.log("⚠️ No upcoming lucky draw found for user");
      return res.status(200).json({
        Result: 0,
        message: "No upcoming lucky draw found for this user",
      });
    }

    // 2️⃣ Find user's last claim
    const lastClaim = await LuckyDrawClaim.findOne({ userId }).sort({
      createdAt: -1,
    });


    // ✅ Case 1: User never claimed before → eligible
    if (!lastClaim) {
      console.log("✅ No last claim found → User eligible for first draw");
      return res.status(200).json({
        Result: 1,
        message: "User eligible for first lucky draw",
        Data: {
          drawTime: toLocalISOString(upcomingRange.drawTime),
          isEligible: true,
        },
      });
    }

    // ✅ Case 2: User has claimed before → check nextClaimTime
    if (lastClaim.nextClaimTime) {
        return res.status(200).json({
          Result: 1,
          message: "User eligible for upcoming lucky draw",
          Data: {
            drawTime: toLocalISOString(lastClaim.nextClaimTime),
            isEligible: true,
          },
        });
    }

    // 🟢 Fallback → eligible
    console.log("⚙️ No nextClaimTime field found → Default eligible");
    return res.status(200).json({
      Result: 1,
      message: "User eligible for upcoming lucky draw",
      Data: {
        drawTime: toLocalISOString(upcomingRange.drawTime),
        isEligible: true,
      },
    });
  } catch (err) {
    console.error("❌ Error fetching upcoming LuckyDraw:", err);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};








