// backend/routes/terms.js - FIXED VERSION
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

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  next();
};

// GET /api/terms - Get all terms
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT id, term_number, term_name, exam_month, exam_year, status, created_at
      FROM terms 
      ORDER BY exam_year DESC, term_number DESC
    `;
    
    const result = await db.execute(sql);
    res.json({ success: true, terms: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/terms - Create new term
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { term_number, term_name, exam_month, exam_year } = req.body;
    
    // Validate term number (1, 2, or 3)
    if (term_number < 1 || term_number > 3) {
      return res.status(400).json({ success: false, error: 'Term number must be 1, 2, or 3' });
    }
    
    // Check if term already exists for this year
    const existingTerm = await db.execute(
      'SELECT id FROM terms WHERE term_number = $1 AND exam_year = $2',
      [term_number, exam_year]
    );
    
    if (existingTerm.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `Term ${term_number} already exists for year ${exam_year}` 
      });
    }
    
    const sql = `
      INSERT INTO terms (term_number, term_name, exam_month, exam_year, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING *
    `;
    
    const result = await db.execute(sql, [term_number, term_name, exam_month, exam_year]);
    res.status(201).json({ success: true, term: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/terms/current - Get current active term
router.get('/current', requireAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = currentDate.getFullYear();
    
    // Find the most recent term that hasn't ended yet
    const sql = `
      SELECT id, term_number, term_name, exam_month, exam_year, status
      FROM terms 
      WHERE status = 'active' 
        AND (exam_year > $1 OR (exam_year = $1 AND exam_month >= $2))
      ORDER BY exam_year ASC, term_number ASC
      LIMIT 1
    `;
    
    const result = await db.execute(sql, [currentYear, currentMonth]);
    
    if (result.rows.length === 0) {
      // If no current term found, get the most recent term
      const recentTerm = await db.execute(`
        SELECT id, term_number, term_name, exam_month, exam_year, status
        FROM terms 
        WHERE status = 'active'
        ORDER BY exam_year DESC, term_number DESC
        LIMIT 1
      `);
      
      return res.json({ success: true, term: recentTerm.rows[0] || null });
    }
    
    res.json({ success: true, term: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;