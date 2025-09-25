const jwt = require('jsonwebtoken');
const User = require('../Models/user');

const admin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    // Verify JWT
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check user type
    if (user.userType !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    // Check if token exists in user's saved tokens
    const tokenExists = user.tokens?.some(t => t.accessToken === token);
    if (!tokenExists) {
      return res.status(401).json({ message: 'Token is invalid or has been revoked' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
};

module.exports = admin;
