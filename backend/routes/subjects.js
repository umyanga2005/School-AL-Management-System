// backend/routes/subjects.js
const express = require('express');
const { db } = require('../config/database');
const router = express.Router();

// Authentication middleware
const requireAuth = async (req, res, next) => {
  // Implementation from auth.js
};

const requireAdmin = (req, res, next) => {
  // Implementation from auth.js
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

// GET /api/students/:id/subjects - Get subjects assigned to a student
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

// POST /api/students/:id/subjects - Assign subjects to a student
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

module.exports = router;