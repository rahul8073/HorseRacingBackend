const Razorpay = require("razorpay");
const crypto = require("crypto");
const User = require("../Models/user");
const Transaction = require("../Models/transaction");
const WithdrawalRequest = require("../Models/WithdrawRequest");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// --------------------- USER DEPOSIT VIA RAZORPAY ---------------------
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const order = await razorpayInstance.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    await Transaction.create({
      userId,
      type: "deposit",
      amount,
      status: "pending",
      gateway: "razorpay",
      referenceId: order.id,
    });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error creating Razorpay order", error: error.message });
  }
};

// --------------------- RAZORPAY PAYMENT VERIFICATION ---------------------
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const transaction = await Transaction.findOne({ referenceId: razorpay_order_id });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    transaction.status = "success";
    transaction.referenceId = razorpay_payment_id;
    await transaction.save();

    const user = await User.findById(transaction.userId);
    user.walletBalance += transaction.amount;
    await user.save();

    res.status(200).json({ message: "Payment successful", walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: "Error verifying payment", error: error.message });
  }
};

// --------------------- MANUAL TRANSACTION (ADMIN) ---------------------
const manualTransaction = async (req, res) => {
  try {
    const { userId, amount, type } = req.body; // type = deposit/bonus
    if (!userId || !amount || !type) return res.status(400).json({ message: "All fields required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (type === "deposit") user.walletBalance += amount;
    else if (type === "bonus") user.bonusBalance += amount;
    else return res.status(400).json({ message: "Invalid type" });

    await user.save();

    await Transaction.create({
      userId,
      type,
      amount,
      status: "success",
      gateway: "manual",
      referenceId: `MANUAL-${Date.now()}`,
    });

    res.status(200).json({ message: "Manual transaction successful", user });
  } catch (error) {
    res.status(500).json({ message: "Error adding manual transaction", error: error.message });
  }
};

// --------------------- USER WITHDRAW REQUEST ---------------------
const requestWithdrawal = async (req, res) => {
  try {
    const { amount, method, accountDetails } = req.body;
    const userId = req.user.id;

    if (!amount || !method || !accountDetails) return res.status(400).json({ message: "All fields required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletBalance < amount) return res.status(400).json({ message: "Insufficient wallet balance" });

    const withdrawal = new WithdrawalRequest({
      userId,
      amount,
      method,
      accountDetails,
      status: "pending",
    });

    await withdrawal.save();
    res.status(201).json({ message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    res.status(500).json({ message: "Error creating withdrawal request", error: error.message });
  }
};

// --------------------- ADMIN APPROVE/REJECT WITHDRAW ---------------------
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status } = req.body; // approved / rejected
    const adminId = req.user._id;

    const withdrawal = await WithdrawalRequest.findById(withdrawalId);
    if (!withdrawal)
      return res.status(404).json({ message: "Withdrawal request not found" });

    const user = await User.findById(withdrawal.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (status === "approved") {
      if (user.walletBalance < withdrawal.amount)
        return res.status(400).json({ message: "Insufficient wallet balance" });

      // Deduct from wallet
      user.walletBalance -= withdrawal.amount;
      await user.save();

      // Direct bank transfer via Razorpay Payout
      const payout = await razorpay.payouts.create({
        account_number: withdrawal.accountDetails.account_number,
        fund_account: {
          account_type: "bank_account",
          bank_account: withdrawal.accountDetails,
        },
        amount: withdrawal.amount * 100, // in paise
        currency: "INR",
        mode: "IMPS", // or NEFT / RTGS
        purpose: "payout",
        narration: "Horse Racing Game Withdrawal",
      });

      // Log transaction
      await Transaction.create({
        userId: user._id,
        type: "withdraw",
        amount: withdrawal.amount,
        status: "pending", // update later when Razorpay confirms
        gateway: withdrawal.method,
        referenceId: payout.id,
      });

      withdrawal.status = "approved";
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      withdrawal.payoutId = payout.id; // save Razorpay payout ID
      await withdrawal.save();

      res.status(200).json({
        message: "Withdrawal approved and payout initiated successfully",
        withdrawal,
        payout,
      });
    } else if (status === "rejected") {
      withdrawal.status = "rejected";
      withdrawal.processedBy = adminId;
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      res.status(200).json({ message: "Withdrawal rejected successfully", withdrawal });
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }
  } catch (error) {
    console.error("Error updating withdrawal:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// --------------------- GET ALL WITHDRAWAL REQUESTS (ADMIN) ---------------------
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const { status, startDate, endDate, userId } = req.query; // optional filters
    let filter = {};

    if (status) filter.status = status; // pending / approved / rejected
    if (userId) filter.userId = userId;
    if (startDate || endDate) filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);

    const withdrawals = await WithdrawalRequest.find(filter)
      .populate("userId", "name email walletBalance")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Withdrawal requests fetched successfully",
      withdrawals,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching withdrawal requests",
      error: error.message,
    });
  }
};

// --------------------- GET ALL TRANSACTIONS (ADMIN) ---------------------
const getAllTransactions = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query; // optional filters
    let filter = {};
    if (type) filter.type = type;
    if (startDate || endDate) filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);

    const transactions = await Transaction.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error: error.message });
  }
};

// --------------------- GET TRANSACTIONS OF PARTICULAR USER ---------------------
const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.userType !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { type, startDate, endDate } = req.query;
    let filter = { userId };
    if (type) filter.type = type;
    if (startDate || endDate) filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);

    const transactions = await Transaction.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "User transactions fetched successfully", transactions });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user transactions", error: error.message });
  }
};


module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  manualTransaction,
  requestWithdrawal,
  updateWithdrawalStatus,
  getAllWithdrawalRequests,
  getAllTransactions,
  getUserTransactions,

};
