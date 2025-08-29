// backend/routes/classes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Authentication middleware
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authorization header missing' 
      });
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: parseInt(payload.userId),
      username: payload.username,
      role: payload.role,
      assignedClass: payload.assignedClass
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

// GET /api/classes - Get all classes from students table
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT current_class as class_name
      FROM students 
      WHERE status = 'active'
      ORDER BY current_class
    `;
    
    const result = await db.execute(sql);
    res.json({ success: true, classes: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;