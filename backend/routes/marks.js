// backend/routes/marks.js
const express = require('express');
const { db } = require('../config/database');
const router = express.Router();

// Authentication middleware
const requireAuth = async (req, res, next) => {
  // Implementation from auth.js
};

const requireTeacherOrCoordinator = (req, res, next) => {
  // Implementation from auth.js
};

// GET /api/marks - Get marks with filters
router.get('/', requireAuth, requireTeacherOrCoordinator, async (req, res) => {
  try {
    const { student_id, subject_id, term_id, class: studentClass } = req.query;
    
    let sql = `
      SELECT m.id, m.student_id, m.subject_id, m.term_id, m.marks, m.entry_date, m.status,
             s.name as student_name, s.index_number, s.current_class,
             sub.subject_name, sub.subject_code,
             t.term_number, t.term_name, t.exam_year
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN terms t ON m.term_id = t.id
      WHERE m.status = 'active'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (student_id) {
      sql += ` AND m.student_id = $${++paramCount}`;
      params.push(student_id);
    }
    
    if (subject_id) {
      sql += ` AND m.subject_id = $${++paramCount}`;
      params.push(subject_id);
    }
    
    if (term_id) {
      sql += ` AND m.term_id = $${++paramCount}`;
      params.push(term_id);
    }
    
    if (studentClass) {
      sql += ` AND s.current_class = $${++paramCount}`;
      params.push(studentClass);
    }
    
    sql += ' ORDER BY t.exam_year DESC, t.term_number DESC, s.current_class, s.index_number';
    
    const result = await db.execute(sql, params);
    res.json({ success: true, marks: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/marks - Enter marks
router.post('/', requireAuth, requireTeacherOrCoordinator, async (req, res) => {
  try {
    const { student_id, subject_id, term_id, marks } = req.body;
    
    // Validate marks (0-100)
    if (marks < 0 || marks > 100) {
      return res.status(400).json({ success: false, error: 'Marks must be between 0 and 100' });
    }
    
    // Check if marks already exist for this student, subject, and term
    const existingMarks = await db.execute(
      'SELECT id FROM marks WHERE student_id = $1 AND subject_id = $2 AND term_id = $3',
      [student_id, subject_id, term_id]
    );
    
    if (existingMarks.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Marks already entered for this student, subject, and term' 
      });
    }
    
    const sql = `
      INSERT INTO marks (student_id, subject_id, term_id, marks, teacher_id, entry_date, status)
      VALUES ($1, $2, $3, $4, $5, NOW(), 'active')
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      student_id, subject_id, term_id, marks, req.user.id
    ]);
    
    res.status(201).json({ success: true, mark: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/marks/:id - Update marks
router.put('/:id', requireAuth, requireTeacherOrCoordinator, async (req, res) => {
  try {
    const { id } = req.params;
    const { marks } = req.body;
    
    // Validate marks (0-100)
    if (marks < 0 || marks > 100) {
      return res.status(400).json({ success: false, error: 'Marks must be between 0 and 100' });
    }
    
    const sql = `
      UPDATE marks 
      SET marks = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.execute(sql, [marks, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Marks record not found' });
    }
    
    res.json({ success: true, mark: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/marks/student/:id/term/:termId - Get marks for a specific student and term
router.get('/student/:id/term/:termId', requireAuth, async (req, res) => {
  try {
    const { id, termId } = req.params;
    
    const sql = `
      SELECT m.id, m.student_id, m.subject_id, m.term_id, m.marks, m.entry_date,
             sub.subject_name, sub.subject_code,
             t.term_number, t.term_name, t.exam_year
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN terms t ON m.term_id = t.id
      WHERE m.student_id = $1 AND m.term_id = $2 AND m.status = 'active'
      ORDER BY sub.subject_name
    `;
    
    const result = await db.execute(sql, [id, termId]);
    res.json({ success: true, marks: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/marks/bulk-entry - Bulk marks entry
router.post('/bulk-entry', requireAuth, requireTeacherOrCoordinator, async (req, res) => {
  try {
    const { marksData, term_id } = req.body;
    
    if (!marksData || !marksData.length || !term_id) {
      return res.status(400).json({ success: false, error: 'Marks data and term ID are required' });
    }
    
    // Prepare data for insertion
    const insertData = marksData.filter(item => 
      item.student_id && item.subject_id && item.marks !== undefined && item.marks !== null
    );
    
    if (insertData.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid marks data to insert' });
    }
    
    // Check for existing marks to avoid duplicates
    const existingMarks = await db.execute(`
      SELECT student_id, subject_id FROM marks 
      WHERE term_id = $1 AND (student_id, subject_id) IN (${
        insertData.map((_, i) => `($${i * 2 + 2}, $${i * 2 + 3})`).join(', ')
      })
    `, [term_id, ...insertData.flatMap(item => [item.student_id, item.subject_id])]);
    
    // Filter out duplicates
    const existingSet = new Set(
      existingMarks.rows.map(row => `${row.student_id}-${row.subject_id}`)
    );
    
    const filteredData = insertData.filter(
      item => !existingSet.has(`${item.student_id}-${item.subject_id}`)
    );
    
    if (filteredData.length === 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'All marks already exist for this term' 
      });
    }
    
    // Insert new marks
    const sql = `
      INSERT INTO marks (student_id, subject_id, term_id, marks, teacher_id, entry_date, status)
      VALUES ${filteredData.map((_, i) => 
        `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, NOW(), 'active')`
      ).join(', ')}
      RETURNING *
    `;
    
    const flatParams = filteredData.flatMap(item => [
      item.student_id, item.subject_id, term_id, item.marks, req.user.id
    ]);
    
    const result = await db.execute(sql, flatParams);
    
    res.status(201).json({ 
      success: true, 
      message: `Entered ${result.rows.length} marks records`,
      marks: result.rows,
      duplicates: insertData.length - filteredData.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;