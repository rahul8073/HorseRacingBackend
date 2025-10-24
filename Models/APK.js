// models/ApkUpload.js
const mongoose = require("mongoose");

const ApkSchema = new mongoose.Schema(
  {
    versionName: { type: String, required: true },
    versionCode: { type: Number, required: true },
    fileUrl: { type: String, required: true }, // stored public URL (e.g. Cloud / local)
    changeLog: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApkUpload", ApkSchema);
