const ApkUpload = require("../Models/APK");
const path = require("path");

// 📤 Upload APK
const uploadApk = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const { versionName, versionCode, changeLog } = req.body;
    if (!versionName || !versionCode)
      return res.status(400).json({ message: "versionName and versionCode are required" });

    // Generate public file URL (served statically from /uploads)
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/apk/${req.file.filename}`;

    const apk = new ApkUpload({
      versionName,
      versionCode,
      changeLog,
      fileUrl,
      uploadedBy: req.user?._id || null,
    });

    await apk.save();

    res.status(201).json({
      message: "APK uploaded successfully",
      apk,
      downloadUrl: fileUrl,
    });
  } catch (err) {
    res.status(500).json({ message: "Error uploading APK", error: err.message });
  }
};

// 🔗 Get Latest APK
const getLatestApk = async (req, res) => {
  try {
    const latest = await ApkUpload.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).json({ message: "No APK found" });

    res.status(200).json({
      message: "Latest APK fetched",
      versionName: latest.versionName,
      versionCode: latest.versionCode,
      downloadUrl: latest.fileUrl,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching latest APK", error: err.message });
  }
};

// 📋 Get All APKs (for admin/dashboard)
const getAllApks = async (req, res) => {
  try {
    const apks = await ApkUpload.find().sort({ createdAt: -1 });

    if (!apks.length) {
      return res.status(404).json({ message: "No APKs uploaded yet" });
    }

    res.status(200).json({
      message: "All APKs fetched successfully",
      total: apks.length,
      apks,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching APK list", error: err.message });
  }
};

module.exports = { uploadApk, getLatestApk, getAllApks };
