// backend/routes/savedReports.js
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

// POST /api/saved-reports - Save a report
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      termId, 
      className, 
      academicYear, 
      rankingMethod, 
      reportData 
    } = req.body;

    if (!termId || !academicYear || !rankingMethod || !reportData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Insert the report into the database
    const result = await db.execute(
      `INSERT INTO saved_reports 
        (term_id, class_name, academic_year, ranking_method, report_data, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, generated_at`,
      [termId, className, academicYear, rankingMethod, reportData, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Report saved successfully',
      reportId: result.rows[0].id,
      generatedAt: result.rows[0].generated_at
    });

  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save report' 
    });
  }
});

// GET /api/saved-reports - Get all saved reports for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT sr.*, t.term_name, t.term_number 
       FROM saved_reports sr
       JOIN terms t ON sr.term_id = t.id
       WHERE sr.created_by = $1 
       ORDER BY sr.generated_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      reports: result.rows
    });

  } catch (error) {
    console.error('Error fetching saved reports:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch saved reports' 
    });
  }
});

// GET /api/saved-reports/:id - Get a specific saved report
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.execute(
      `SELECT sr.*, t.term_name, t.term_number 
       FROM saved_reports sr
       JOIN terms t ON sr.term_id = t.id
       WHERE sr.id = $1 AND sr.created_by = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    res.json({
      success: true,
      report: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching saved report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch saved report' 
    });
  }
});

// DELETE /api/saved-reports/:id - Delete a saved report
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.execute(
      'DELETE FROM saved_reports WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting saved report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete report' 
    });
  }
});

module.exports = router;