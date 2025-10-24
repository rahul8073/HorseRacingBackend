const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNo: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
  },
  password: { type: String, required: true },
  userType: { type: String, default: "user" },
  walletBalance: { type: Number, default: 0 },
  bonusBalance: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  tokens: [
    {
      accessToken: String,
      refreshToken: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
