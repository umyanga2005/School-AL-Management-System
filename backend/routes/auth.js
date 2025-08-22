// backend/routes/auth.js - Fixed Version
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    assignedClass: user.assigned_class // Add assigned class to token
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

// Login endpoint - Fixed to work with all roles
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt for username:', username);

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Hash the provided password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Find user in database - FIXED: Search for ALL roles including coordinator
    const sql = `
      SELECT 
        id, 
        username, 
        password_hash, 
        role, 
        full_name, 
        assigned_class, 
        temp_password 
      FROM users 
      WHERE username = $1
    `;
    
    console.log('🔍 Searching for user:', username);
    
    const result = await db.execute(sql, [username]);

    if (result.rows.length === 0) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];
    console.log('👤 Found user:', user.username, 'with role:', user.role);

    // Check password
    if (user.password_hash !== passwordHash) {
      console.log('❌ Invalid password for user:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    console.log('✅ Login successful for:', username, '(' + user.role + ')');

    // Check if password change is required
    const requireChange = user.temp_password === true;

    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      requireChange: requireChange,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.full_name,
        assignedClass: user.assigned_class
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed: ' + error.message
    });
  }
});

// Change password endpoint - Enhanced with better error handling
router.post('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    console.log('🔒 Password change attempt for:', username);

    // Validation
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Username, current password, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Hash passwords
    const currentPasswordHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Find user and verify current password
    const findUserSql = `
      SELECT id, password_hash, role, full_name, assigned_class 
      FROM users 
      WHERE username = $1
    `;
    
    const userResult = await db.execute(findUserSql, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (user.password_hash !== currentPasswordHash) {
      console.log('❌ Invalid current password for:', username);
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Update password
    const updateSql = `
      UPDATE users 
      SET password_hash = $1, temp_password = false 
      WHERE id = $2
      RETURNING id, username, role, full_name, assigned_class
    `;
    
    const updateResult = await db.execute(updateSql, [newPasswordHash, user.id]);
    const updatedUser = updateResult.rows[0];

    // Generate new token after password change
    const newToken = generateToken(updatedUser);

    console.log('✅ Password changed successfully for:', username);

    res.json({
      success: true,
      message: 'Password changed successfully',
      token: newToken,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        name: updatedUser.full_name,
        assignedClass: updatedUser.assigned_class
      }
    });

  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password: ' + error.message
    });
  }
});

// Verify token endpoint (useful for debugging)
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    
    console.log('🎫 Token verified for user:', payload.username);
    
    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
        assignedClass: payload.assignedClass
      }
    });

  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Auth test endpoint hit');
  res.json({
    success: true,
    message: 'Auth route is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;