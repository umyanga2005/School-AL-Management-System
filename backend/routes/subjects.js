// backend/routes/subjects.js - FIXED VERSION
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

// GET /api/subjects - Get all subjects
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = `
      SELECT id, subject_code, subject_name, stream, description, status
      FROM subjects 
      WHERE status = 'active'
      ORDER BY stream, subject_name
    `;
    
    const result = await db.execute(sql);
    res.json({ success: true, subjects: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/subjects - Create new subject
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { subject_code, subject_name, stream, description } = req.body;
    
    const sql = `
      INSERT INTO subjects (subject_code, subject_name, stream, description, status)
      VALUES ($1, $2, $3, $4, 'active')
      RETURNING *
    `;
    
    const result = await db.execute(sql, [subject_code, subject_name, stream, description]);
    res.status(201).json({ success: true, subject: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/subjects/:id - Update subject
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_code, subject_name, stream, description, status } = req.body;
    
    const sql = `
      UPDATE subjects 
      SET subject_code = $1, subject_name = $2, stream = $3, description = $4, status = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;
    
    const result = await db.execute(sql, [subject_code, subject_name, stream, description, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }
    
    res.json({ success: true, subject: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/subjects/students/:id/subjects - Get subjects assigned to a student
router.get('/students/:id/subjects', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { academic_year } = req.query;
    
    // Get student's index_number first
    const studentCheck = await db.execute(
      'SELECT index_number FROM students WHERE id = $1 AND status = \'active\'', 
      [id]
    );
    
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    const indexNumber = studentCheck.rows[0].index_number;
    
    let sql = `
      SELECT ss.id, ss.index_number, ss.subject_id, ss.academic_year, ss.assigned_date,
             s.subject_code, s.subject_name, s.stream
      FROM student_subjects ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.index_number = $1 AND s.status = 'active'
    `;
    
    const params = [indexNumber];
    
    if (academic_year) {
      sql += ' AND ss.academic_year = $2';
      params.push(academic_year);
    }
    
    sql += ' ORDER BY s.stream, s.subject_name';
    
    const result = await db.execute(sql, params);
    res.json({ success: true, studentSubjects: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/subjects/students/:id/subjects - Assign subjects to a student
router.post('/students/:id/subjects', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_ids, academic_year } = req.body;
    
    // Get student's index_number
    const studentCheck = await db.execute(
      'SELECT index_number, current_class FROM students WHERE id = $1',
      [id]
    );
    
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    const indexNumber = studentCheck.rows[0].index_number;
    const currentClass = studentCheck.rows[0].current_class;
    
    // Check if user has permission
    if (req.user.role !== 'admin') {
      // Teachers/coordinators can only assign to their own class
      if (req.user.assignedClass && currentClass !== req.user.assignedClass) {
        return res.status(403).json({ 
          success: false, 
          error: 'Not authorized to assign subjects to this student' 
        });
      }
    }
    
    if (!subject_ids || !subject_ids.length || !academic_year) {
      return res.status(400).json({ success: false, error: 'Subject IDs and academic year are required' });
    }
    
    // Remove existing assignments for this academic year
    await db.execute(
      'DELETE FROM student_subjects WHERE index_number = $1 AND academic_year = $2',
      [indexNumber, academic_year]
    );
    
    // Insert new assignments
    const assignments = subject_ids.map(subject_id => [
      indexNumber, subject_id, academic_year, new Date()
    ]);
    
    if (assignments.length > 0) {
      const values = assignments.map((_, index) => 
        `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
      ).join(', ');
      
      const sql = `
        INSERT INTO student_subjects (index_number, subject_id, academic_year, assigned_date)
        VALUES ${values}
        RETURNING *
      `;
      
      const flatParams = assignments.flat();
      const result = await db.execute(sql, flatParams);
      
      res.status(201).json({ 
        success: true, 
        message: `Assigned ${result.rows.length} subjects to student`,
        studentSubjects: result.rows 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'No subjects assigned (all removed)',
        studentSubjects: [] 
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



module.exports = router;