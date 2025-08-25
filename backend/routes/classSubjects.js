// backend/routes/classSubjects.js
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

const requireAdminOrCoordinator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin or coordinator access required' 
    });
  }
  next();
};

// GET /api/classes/:className/subjects - Get subjects for a class
router.get('/:className/subjects', requireAuth, async (req, res) => {
  try {
    const { className } = req.params;
    
    // Get subjects assigned to this class
    const result = await db.execute(
      `SELECT s.id, s.subject_name, s.subject_code, s.stream, cs.academic_year
       FROM class_subjects cs
       JOIN subjects s ON cs.subject_id = s.id
       WHERE cs.class_name = $1 AND cs.status = 'active'
       ORDER BY s.subject_name`,
      [className]
    );
    
    res.json({ success: true, subjects: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/classes/:className/subjects - Assign subjects to a class
router.post('/:className/subjects', requireAuth, requireAdminOrCoordinator, async (req, res) => {
  try {
    const { className } = req.params;
    const { subjectIds, academicYear } = req.body;
    
    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'subjectIds must be a non-empty array' 
      });
    }
    
    if (!academicYear) {
      return res.status(400).json({ 
        success: false, 
        error: 'academicYear is required' 
      });
    }
    
    // Use a transaction for bulk operations
    await db.beginTransaction();
    
    try {
      // First, mark all existing class subjects as inactive
      await db.execute(
        `UPDATE class_subjects 
         SET status = 'inactive', updated_at = NOW()
         WHERE class_name = $1 AND academic_year = $2`,
        [className, academicYear]
      );
      
      // Then insert the new assignments
      for (const subjectId of subjectIds) {
        // Check if this subject already exists for this class and year
        const existingCheck = await db.execute(
          `SELECT id FROM class_subjects 
           WHERE class_name = $1 AND subject_id = $2 AND academic_year = $3`,
          [className, subjectId, academicYear]
        );
        
        if (existingCheck.rows.length > 0) {
          // Reactivate existing assignment
          await db.execute(
            `UPDATE class_subjects 
             SET status = 'active', updated_at = NOW()
             WHERE id = $1`,
            [existingCheck.rows[0].id]
          );
        } else {
          // Create new assignment
          await db.execute(
            `INSERT INTO class_subjects (class_name, subject_id, academic_year)
             VALUES ($1, $2, $3)`,
            [className, subjectId, academicYear]
          );
        }
      }
      
      await db.commitTransaction();
      
      // Return the updated list of subjects for this class
      const result = await db.execute(
        `SELECT s.id, s.subject_name, s.subject_code, s.stream, cs.academic_year
         FROM class_subjects cs
         JOIN subjects s ON cs.subject_id = s.id
         WHERE cs.class_name = $1 AND cs.status = 'active' AND cs.academic_year = $2
         ORDER BY s.subject_name`,
        [className, academicYear]
      );
      
      res.status(201).json({ 
        success: true, 
        message: `Subjects assigned to ${className} for ${academicYear}`,
        subjects: result.rows 
      });
    } catch (error) {
      await db.rollbackTransaction();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;