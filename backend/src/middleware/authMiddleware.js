const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_careernest_jwt_key_2026_student_project'
      );

      let user = null;
      if (require('mongoose').connection.readyState === 1) {
        user = await User.findById(decoded.id).select('-password');
      } else {
        const FallbackStore = require('../services/fallbackStore');
        user = await FallbackStore.findUserById(decoded.id);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User account no longer exists. Please log in again.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[Auth Error]', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token missing. Please sign in.',
    });
  }
};

module.exports = { protect };
