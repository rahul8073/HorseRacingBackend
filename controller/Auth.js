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
// const register = async (req, res) => {
//   try {
//     const { name, email, password, userType } = req.body;
//     if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

//     const existingUser = await User.findOne({ email });
//     if (existingUser) return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = new User({ name, email, password: hashedPassword, userType: userType || "user" });
//     await newUser.save();

//     const tokens = generateTokens(newUser._id);
//     newUser.tokens.push(tokens);
//     await newUser.save();

//     res.status(201).json({ message: "User registered", user: newUser, ...tokens });
//   } catch (err) {
//     res.status(500).json({ message: "Error registering user", error: err.message });
//   }
// };

const register = async (req, res) => {
  try {
    const { name, email, phoneNo, password, userType } = req.body;

    // 1️⃣ Basic validation
    if (!name || !password || (!email && !phoneNo)) {
      return res.status(400).json({ message: "Name, password and either email or phone number are required" });
    }

    // 2️⃣ Check for existing user (by email or phone)
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNo }],
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email or phone number" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create new user
    const newUser = new User({
      name,
      email: email || null,
      phoneNo: phoneNo || null,
      password: hashedPassword,
      userType: userType || "user",
    });

    await newUser.save();

    // 5️⃣ Generate tokens and attach
    const tokens = generateTokens(newUser._id);
    newUser.tokens.push(tokens);
    await newUser.save();

    // 6️⃣ Send response
    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      ...tokens,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error registering user",
      error: err.message,
    });
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

//     const tokens = generateTokens(user._id);

//     user.tokens = [tokens];
//     await user.save();

//     if (user.userType === "admin") {
//       // Admin: only username and tokens
//       return res.status(200).json({
//         message: "Login successful",
//         username: user.name || user.email,
//         ...tokens,
//       });
//     } else {
//       // Non-admin: full user info + active horses
//       const activeHorseCount = await Horses.countDocuments({ isActive: true });

//       return res.status(200).json({
//         message: "Login successful",
//         user,
//         activeHorseCount,
//         ...tokens,
//       });
//     }
//   } catch (err) {
//     res.status(500).json({ message: "Error logging in", error: err.message });
//   }
// };

const login = async (req, res) => {
  try {
    const { email, phoneNo, password } = req.body;

    // Allow login with either email, phoneNo, or a single 'loginId' field
    const identifier = email || phoneNo;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/Phone and password are required" });
    }

    // Detect whether it's an email or phone number
    const query = identifier.includes("@")
      ? { email: identifier }
      : { phoneNo: identifier };

    // Find user
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ message: "User blocked by admin" });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate new tokens
    const tokens = generateTokens(user._id);
    user.tokens = [tokens];
    await user.save();

    // Admin and user login responses
    if (user.userType === "admin") {
      return res.status(200).json({
        message: "Login successful",
        username: user.name || user.email || user.phoneNo,
        ...tokens,
      });
    } else {
      const activeHorseCount = await Horses.countDocuments({ isActive: true });
      return res.status(200).json({
        message: "Login successful",
        user,
        activeHorseCount,
        ...tokens,
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Error logging in",
      error: err.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const requesterId = req.user?._id; // set by your auth middleware
    const requesterType = req.user?.userType;

    // 1️⃣ Validate input
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // 2️⃣ Find target user
    const targetUser = await User.findById(userId || requesterId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3️⃣ If admin, can change anyone’s password directly
    if (requesterType === "admin" && userId && userId !== requesterId.toString()) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      targetUser.password = hashedPassword;
      targetUser.tokens = []; // logout all devices
      await targetUser.save();

      return res.status(200).json({
        message: `Password successfully changed for ${targetUser.name || targetUser.email || targetUser.phoneNo}`,
      });
    }

    // 4️⃣ For normal user (self-password change)
    if (!oldPassword) {
      return res.status(400).json({ message: "Old password is required" });
    }

    const isMatch = await bcrypt.compare(oldPassword, targetUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    targetUser.password = hashedPassword;
    targetUser.tokens = []; // logout all devices
    await targetUser.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error changing password", error: err.message });
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
    const { name, email, phoneNo } = req.body;

    // 1️⃣ Find the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Check for duplicate email or phone (if changed)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
      user.email = email;
    }

    if (phoneNo && phoneNo !== user.phoneNo) {
      const existingPhone = await User.findOne({ phoneNo });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already in use by another user" });
      }
      user.phoneNo = phoneNo;
    }

    // 3️⃣ Update name if provided
    if (name) user.name = name;

    // 4️⃣ Save updated user
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating profile",
      error: err.message,
    });
  }
};


module.exports = { register, login, logout, refreshToken ,getProfile,updateProfile,changePassword};
