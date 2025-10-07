require('dotenv').config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");
const Horses = require('../Models/Horses');

// Helper to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_SECRET, { expiresIn: "7d" });
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_SECRET, { expiresIn: "14d" });
  return { accessToken, refreshToken };
};

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword, userType: userType || "user" });
    await newUser.save();

    const tokens = generateTokens(newUser._id);
    newUser.tokens.push(tokens);
    await newUser.save();

    res.status(201).json({ message: "User registered", user: newUser, ...tokens });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
};

// Login
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ message: "All fields required" });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });
//     if (user.isBlocked) return res.status(403).json({ message: "User blocked" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     // ✅ Generate new tokens
//     const tokens = generateTokens(user._id);

//     // ✅ Remove old tokens and save only the new one
//     user.tokens = [tokens];
//     await user.save();

//     res.status(200).json({ message: "Login successful", user, ...tokens });
//   } catch (err) {
//     res.status(500).json({ message: "Error logging in", error: err.message });
//   }
// };

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ message: "User blocked" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const tokens = generateTokens(user._id);

    user.tokens = [tokens];
    await user.save();

    if (user.userType === "admin") {
      // Admin: only username and tokens
      return res.status(200).json({
        message: "Login successful",
        username: user.name || user.email,
        ...tokens,
      });
    } else {
      // Non-admin: full user info + active horses
      const activeHorseCount = await Horses.countDocuments({ isActive: true });

      return res.status(200).json({
        message: "Login successful",
        user,
        activeHorseCount,
        ...tokens,
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};


// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const user = await User.findOne({ "tokens.refreshToken": refreshToken });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.tokens = user.tokens.filter(t => t.refreshToken !== refreshToken);
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error logging out", error: err.message });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if refresh token exists in DB
    const tokenExists = user.tokens.some(t => t.refreshToken === refreshToken);
    if (!tokenExists) return res.status(401).json({ message: "Refresh token invalid" });

    const tokens = generateTokens(user._id);

    // Remove old token and add new token
    user.tokens = user.tokens.filter(t => t.refreshToken !== refreshToken);
    user.tokens.push(tokens);
    await user.save();

    res.status(200).json({ message: "Token refreshed", ...tokens });
  } catch (err) {
    res.status(401).json({ message: "Invalid refresh token", error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user._id; // assuming auth middleware sets req.user

    const user = await User.findById(userId).select("-password -tokens"); // exclude sensitive info
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, email } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

module.exports = { register, login, logout, refreshToken ,getProfile,updateProfile};
