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
  password: {
    type: String,
    required: true,
    // validate: {
    //   validator: function(value) {
    //     // Regex for strong password
    //     return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
    //   },
    //   message: props => 
    //     "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"
    // }
  },
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
