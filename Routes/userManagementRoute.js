const express = require("express");
const { getAllUsers, blockUser, unblockUser, deleteUser } = require("../controller/UserManagement");
const router = express.Router();
const auth = require("../middleware/middleware");
const admin = require("../middleware/Admin");
// Admin routes
router.get("/users",auth,admin, getAllUsers);
router.get("/users/block/:userId",auth,admin, blockUser);
router.get("/users/unblock/:userId",auth,admin, unblockUser);
router.get("/users/:userId",auth,admin, deleteUser);

module.exports = router;
