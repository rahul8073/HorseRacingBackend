const User = require("../Models/user");

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    // Only fetch users with userType not 'admin'
    const users = await User.find({ userType: { $ne: "admin" } }).select("-password"); 
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};


// Block a user
const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("UserId:",userId)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User blocked successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error blocking user", error: error.message });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User unblocked successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error unblocking user", error: error.message });
  }
};

// Delete a user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user?._id; // middleware se user aana chahiye
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: User not logged in" });
    }

    const user = await User.findById(userId).select("walletBalance bonusBalance name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Wallet balance fetched successfully",
      walletBalance: user.walletBalance,
      bonusBalance: user.bonusBalance,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getWalletBalance
};
