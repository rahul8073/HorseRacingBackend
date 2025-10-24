// routes/apkRoutes.js
const express = require("express");
const router = express.Router();
const { uploadApk, getLatestApk, getAllApks } = require("../controller/APKController");
const apkUpload = require("../middleware/uploadAPK");
const admin= require("../middleware/Admin"); // optional

// POST upload APK (admin only)
router.post("/upload", admin, apkUpload.single("apkFile"), uploadApk);

// GET latest APK download info
router.get("/latestAPK", getLatestApk);
router.get("/allAPK",admin, getAllApks);

module.exports = router;
