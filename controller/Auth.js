const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const user = require('../Model/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// Register User
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // console.log(req.body,"req.body data a rha h");
        // Check if all required fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        // Check if user already exists
        const existingUser = await user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new user({
            name,
            email,
            password: hashedPassword,
        });

        // Save the user to the database
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ id: newUser._id }, process.env.secretKey,);

        // Return the token and user info
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser._id, name: newUser.name, email: newUser.email },
            token,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error registering user',
            error: error.message,
        });
    }
};

// Login User
const login = async (req, res) => {
    try {
        // console.log(req.body,"login ");
        
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill all fields' });
        }

        // Find the user by email
        const User = await user.findOne({ email });
        if (!User) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, User.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: User._id }, process.env.secretKey, );

        // Return the token and user info
        res.status(200).json({
            message: 'User logged in successfully',
            user: { id: User._id, name: User.name, email: User.email },
            token,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error logging in user',
            error: error.message,
        });
    }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await user.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token and expiry (15 minutes)
    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await existingUser.save();

    // Set up email transport (use real credentials in prod)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.emailUser,
        pass: process.env.emailPass,
      },
    });

    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      to: email,
      from: process.env.emailUser,
      subject: 'Password Reset Link',
      html: `<p>Click <a href="${resetURL}">here</a> to reset your password. This link will expire in 15 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Error in forgot password', error: error.message });
  }
};


module.exports = {
    register,
    login,
};