const express = require("express");
const router = express.Router();
const { uploadApk, getLatestApk, getAllApks, deleteApk } = require("../controller/APKController");
const apkUpload = require("../middleware/uploadAPK");
const admin = require("../middleware/Admin"); // optional

// Upload APK (admin)
router.post("/uploadAPK", admin, apkUpload.single("apkFile"), uploadApk);

// Latest APK (any user)
router.get("/latestAPK", getLatestApk);

// Get all APKs (admin)
router.get("/allAPK", admin, getAllApks);
router.get("/deleteAPK/:id", admin, deleteApk);

module.exports = router;
