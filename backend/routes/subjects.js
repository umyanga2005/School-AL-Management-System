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
    
    let sql = `
      SELECT ss.id, ss.student_id, ss.subject_id, ss.academic_year, ss.assigned_date,
             s.subject_code, s.subject_name, s.stream
      FROM student_subjects ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.student_id = $1 AND s.status = 'active'
    `;
    
    const params = [id];
    
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
router.post('/students/:id/subjects', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_ids, academic_year } = req.body;
    
    if (!subject_ids || !subject_ids.length || !academic_year) {
      return res.status(400).json({ success: false, error: 'Subject IDs and academic year are required' });
    }
    
    // Remove existing assignments for this academic year
    await db.execute(
      'DELETE FROM student_subjects WHERE student_id = $1 AND academic_year = $2',
      [id, academic_year]
    );
    
    // Insert new assignments
    const assignments = subject_ids.map(subject_id => [
      id, subject_id, academic_year, new Date()
    ]);
    
    const sql = `
      INSERT INTO student_subjects (student_id, subject_id, academic_year, assigned_date)
      VALUES ${assignments.map((_, i) => 
        `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`
      ).join(', ')}
      RETURNING *
    `;
    
    const flatParams = assignments.flat();
    const result = await db.execute(sql, flatParams);
    
    res.status(201).json({ 
      success: true, 
      message: `Assigned ${result.rows.length} subjects to student`,
      studentSubjects: result.rows 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students/:id/subjects - Assign subjects to student
router.post('/:id/subjects', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_ids } = req.body;
    
    // First, verify the student exists
    const studentCheck = await db.execute('SELECT id FROM students WHERE id = $1 AND status = \'active\'', [id]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Remove existing subject assignments
    await db.execute('DELETE FROM student_subjects WHERE student_id = $1', [id]);
    
    // Insert new subject assignments
    if (subject_ids && subject_ids.length > 0) {
      const assignments = subject_ids.map(subject_id => [id, subject_id]);
      const sql = `
        INSERT INTO student_subjects (student_id, subject_id)
        VALUES ${assignments.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
      `;
      
      const flatParams = assignments.flat();
      await db.execute(sql, flatParams);
    }
    
    res.json({ success: true, message: 'Subjects assigned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;