const express = require("express");
const { getAllUsers, blockUser, unblockUser, deleteUser, getWalletBalance } = require("../controller/UserManagement");
const router = express.Router();
const auth = require("../middleware/middleware");
const admin = require("../middleware/Admin");
// Admin routes
router.get("/users",auth,admin, getAllUsers);
router.get("/users/block/:userId",auth,admin, blockUser);
router.get("/users/unblock/:userId",auth,admin, unblockUser);
router.get("/users/:userId",auth,admin, deleteUser);
router.get("/wallet-balance", auth, getWalletBalance);

module.exports = router;
