const express = require("express");
const {
  setLuckyDrawRange,
  userLuckyDraw,
  getUserLuckyDrawHistory,
  getAllLuckyDraws,
  getLuckyDrawRange,
  deleteLuckyDrawRange,
  claimLuckyDraw,
  getUpcomingLuckyDraw,
  updateLuckyDrawRange,
} = require("../controller/LuckyDrawController2");
const auth = require("../middleware/middleware"); // user authentication
const admin = require("../middleware/Admin"); // admin check
const router = express.Router();

// --------------------
// Admin routes
// --------------------
router.post("/setRange", admin, setLuckyDrawRange);
router.post("/updateRange", admin, updateLuckyDrawRange);
// Admin can get current range
router.get("/admin/getLuckyDraw", admin,auth, getLuckyDrawRange);
router.get("/admin/all-history", admin, getAllLuckyDraws); // all history for admin
// Admin can delete existing range
router.get("/deleteRange/:id", admin, deleteLuckyDrawRange);

// --------------------
// User routes
// --------------------
router.get("/user/claimLuckyDraw", auth, claimLuckyDraw); // run lucky draw (24hrs check)
router.get("/user/history", auth, getUserLuckyDrawHistory); // user lucky draw history
router.get("/user/getUpComingLuckyDraw",auth, getUpcomingLuckyDraw);

module.exports = router;

