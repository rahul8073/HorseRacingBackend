const WithdrawalRequest = require("../Models/WithdrawRequest");
const User = require("../Models/user");
const { createContact, createFundAccount, createPayout } = require("../Services/Service");

// --------------------- ADMIN: GET ALL WITHDRAWALS ---------------------
exports.getAllWithdrawalRequests = async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find()
      .populate("userId", "name email walletBalance")
      .sort({ createdAt: -1 });

    res.status(200).json({
      Result: 1,
      Data: { message: "Withdrawals fetched successfully", withdrawals },
    });
  } catch (error) {
    res.status(500).json({
      Result: 0,
      Data: { message: "Error fetching withdrawals", error: error.message },
    });
  }
};

// --------------------- USER: CREATE WITHDRAWAL REQUEST ---------------------
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, method, accountDetails } = req.body;

    if (!amount || amount <= 0)
      return res
        .status(400)
        .json({ Result: 0, Data: { message: "Invalid withdrawal amount" } });

    const user = await User.findById(userId);
    if (!user || user.walletBalance < amount)
      return res
        .status(400)
        .json({ Result: 0, Data: { message: "Insufficient balance" } });

    // Deduct balance immediately (optional depending on policy)
    user.walletBalance -= amount;
    await user.save();

    const withdrawal = await WithdrawalRequest.create({
      userId,
      amount,
      method,
      accountDetails,
      status: "pending",
    });

    res.status(200).json({
      Result: 1,
      Data: { message: "Withdrawal request submitted", withdrawal },
    });
  } catch (error) {
    res.status(500).json({
      Result: 0,
      Data: { message: "Error creating withdrawal", error: error.message },
    });
  }
};

// --------------------- ADMIN: UPDATE STATUS (APPROVE / REJECT) ---------------------
// exports.updateWithdrawalStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body; // "approved" or "rejected"

//     const withdrawal = await WithdrawalRequest.findById(id).populate("userId");
//     if (!withdrawal)
//       return res
//         .status(404)
//         .json({ Result: 0, Data: { message: "Withdrawal not found" } });

//     if (withdrawal.status !== "pending")
//       return res
//         .status(400)
//         .json({ Result: 0, Data: { message: "Already processed" } });

//     withdrawal.status = status;
//     await withdrawal.save();

//     // Refund balance if rejected
//     if (status === "rejected") {
//       withdrawal.userId.walletBalance += withdrawal.amount;
//       await withdrawal.userId.save();
//     }

//     res.status(200).json({
//       Result: 1,
//       Data: { message: `Withdrawal ${status} successfully`, withdrawal },
//     });
//   } catch (error) {
//     res.status(500).json({
//       Result: 0,
//       Data: { message: "Error updating withdrawal", error: error.message },
//     });
//   }
// };

exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // approved or rejected
        console.log(id,status);
        
    const withdrawal = await WithdrawalRequest.findById(id).populate("userId");
    if (!withdrawal)
      return res
        .status(404)
        .json({ Result: 0, Data: { message: "Withdrawal not found" } });

    if (withdrawal.status !== "pending")
      return res
        .status(400)
        .json({ Result: 0, Data: { message: "Already processed" } });

    if (status === "rejected") {
      withdrawal.status = "rejected";
      await withdrawal.save();
      withdrawal.userId.walletBalance += withdrawal.amount;
      await withdrawal.userId.save();
      return res.status(200).json({
        Result: 1,
        Data: { message: "Withdrawal rejected, amount refunded" },
      });
    }

    // ✅ APPROVE + Send via Razorpay
    const user = withdrawal.userId;
    const details = withdrawal.accountDetails;
    // Step 1: Create contact
    const contact = await createContact(user);

    // Step 2: Create fund account
    const fund = await createFundAccount(contact.id, details);

    // Step 3: Create payout
    const payout = await createPayout(fund.id, withdrawal.amount);

    withdrawal.status = "approved";
    withdrawal.transactionId = payout.id;
    withdrawal.payoutStatus = payout.status;
    await withdrawal.save();

    res.status(200).json({
      Result: 1,
      Data: {
        message: "Withdrawal approved and Razorpay payout initiated",
        payout,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      Result: 0,
      Data: { message: error.message || "Withdrawal processing failed" },
    });
  }
};

// --------------------- ADMIN/USER: GET USER WITHDRAWALS ---------------------
exports.getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user._id;
    const withdrawals = await WithdrawalRequest.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      Result: 1,
      Data: { message: "User withdrawals fetched", withdrawals },
    });
  } catch (error) {
    res.status(500).json({
      Result: 0,
      Data: { message: "Error fetching user withdrawals", error: error.message },
    });
  }
};
