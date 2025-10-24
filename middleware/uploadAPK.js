// middleware/uploadApk.js
const multer = require("multer");
const path = require("path");

// store locally in /uploads/apk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/apk");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const apkUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== ".apk") {
      return cb(new Error("Only .apk files are allowed"));
    }
    cb(null, true);
  },
});

module.exports = apkUpload;
