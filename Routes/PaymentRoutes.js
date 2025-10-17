const express = require("express");
const router = express.Router();
const auth = require("../middleware/middleware");
const admin = require("../middleware/Admin");
// const paymentController = require("../controller/PaymentController");

// // User deposits via Razorpay
// router.post("/razorpay/order", auth, paymentController.createRazorpayOrder);
// router.post("/razorpay/verify", auth, paymentController.verifyRazorpayPayment);

// // Admin manual deposit/bonus
// router.post("/manual-transaction", auth, admin, paymentController.manualTransaction);

// // Withdrawals
// router.post("/withdraw", auth, paymentController.requestWithdrawal);
// router.post("/withdraw/:withdrawalId", auth, admin, paymentController.updateWithdrawalStatus);
// router.get("/withdrawals", auth,admin, paymentController.getAllWithdrawalRequests); 

// // Transactions
// router.get("/transactions", auth, admin, paymentController.getAllTransactions);
// router.get("/transactions/user/:userId", auth, paymentController.getUserTransactions);

// module.exports = router;



// const express = require("express");
// const router = express.Router();
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  manualTransaction,
  getAllTransactions,
  getUserTransactions,
} = require("../controller/PaymentController");
// const { authMiddleware, adminMiddleware } = require("../Middleware/authMiddleware");

router.post("/razorpay/order",auth, createRazorpayOrder);
router.post("/razorpay/verify",auth, verifyRazorpayPayment);
router.post("/manual", admin, manualTransaction);
router.get("/transactions", admin, getAllTransactions);
router.get("/transactions/:userId", auth, getUserTransactions);

module.exports = router;
