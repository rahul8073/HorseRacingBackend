const express = require("express");
const {
  setLuckyDrawRange,
  userLuckyDraw,
  getUserLuckyDrawHistory,
  getAllLuckyDraws,
  getLuckyDrawRange,
  deleteLuckyDrawRange,
} = require("../controller/LuckyDrawController");
const auth = require("../middleware/middleware"); // user authentication
const admin = require("../middleware/admin"); // admin check
const router = express.Router();

// --------------------
// Admin routes
// --------------------
router.post("/setRange", auth, admin, setLuckyDrawRange);
// Admin can get current range
router.get("/getRange", auth, admin, getLuckyDrawRange);

// Admin can delete existing range
router.get("/deleteRange/:id", auth, admin, deleteLuckyDrawRange);
router.get("/admin/all-history", auth, admin, getAllLuckyDraws); // all history for admin

// --------------------
// User routes
// --------------------
router.get("/user/draw", auth, userLuckyDraw); // run lucky draw (24hrs check)
router.get("/user/history", auth, getUserLuckyDrawHistory); // user lucky draw history

module.exports = router;
