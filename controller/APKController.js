const ApkUpload = require("../Models/APK");
const fs = require("fs");
const path = require("path");

// 📤 Upload APK
const uploadApk = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { versionName, versionCode, changeLog } = req.body;
    if (!versionName || !versionCode)
      return res.status(400).json({ message: "versionName and versionCode are required" });
const PORT = process.env.port;
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.SERVER_URL
    : `http://localhost:${PORT}`;
    const fileUrl = `${BASE_URL}/uploads/apk/${req.file.filename}`;

    const apk = new ApkUpload({
      versionName,
      versionCode,
      changeLog,
      fileUrl,
      uploadedBy: req.user?._id || null,
    });

    await apk.save();

    res.status(201).json({ message: "APK uploaded successfully", apk, downloadUrl: fileUrl });
  } catch (err) {
    res.status(500).json({ message: "Error uploading APK", error: err.message });
  }
};

// 🔗 Get latest APK
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

// 📋 Get all APKs (admin)
const getAllApks = async (req, res) => {
  try {
    const apks = await ApkUpload.find().sort({ createdAt: -1 });
    if (!apks.length) return res.status(404).json({ message: "No APKs uploaded yet" });

    res.status(200).json({ message: "All APKs fetched successfully", total: apks.length, apks });
  } catch (err) {
    res.status(500).json({ message: "Error fetching APKs", error: err.message });
  }
};

// ❌ Delete APK (admin)
const deleteApk = async (req, res) => {
  try {
    const { id } = req.params;
    const apk = await ApkUpload.findById(id);
    if (!apk) return res.status(404).json({ message: "APK not found" });

    // Delete file from server
    const filePath = path.join(__dirname, "..", "uploads", "apk", path.basename(apk.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await apk.deleteOne();

    res.status(200).json({ message: "APK deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting APK", error: err.message });
  }
};

module.exports = { uploadApk, getLatestApk, getAllApks, deleteApk };
