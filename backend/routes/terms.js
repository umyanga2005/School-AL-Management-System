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

// GET /api/terms - Get all terms with filtering and search
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, year, term_number, search, sort_by = 'exam_year', sort_order = 'DESC' } = req.query;
    
    let sql = `
      SELECT t.id, t.term_number, t.term_name, t.exam_month, t.exam_year, 
             t.status, t.created_at, t.updated_at,
             COUNT(m.id) as total_marks_entries
      FROM terms t
      LEFT JOIN marks m ON t.id = m.term_id
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
    
    if (year) {
      conditions.push(`t.exam_year = $${paramIndex}`);
      params.push(parseInt(year));
      paramIndex++;
    }
    
    if (term_number) {
      conditions.push(`t.term_number = $${paramIndex}`);
      params.push(parseInt(term_number));
      paramIndex++;
    }
    
    if (search) {
      conditions.push(`(t.term_name ILIKE $${paramIndex} OR t.exam_year::text ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ` GROUP BY t.id, t.term_number, t.term_name, t.exam_month, t.exam_year, t.status, t.created_at, t.updated_at`;
    
    // Add sorting
    const validSortColumns = ['exam_year', 'term_number', 'term_name', 'created_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'exam_year';
    const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    sql += ` ORDER BY t.${sortColumn} ${sortDirection}, t.term_number ${sortDirection}`;
    
    const result = await db.execute(sql, params);
    res.json({ success: true, terms: result.rows });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ success: false, error: 'Failed to load terms' });
  }
});

// POST /api/terms - Create new term
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { term_number, term_name, exam_month, exam_year, auto_set_active = false } = req.body;
    
    console.log('Creating term with data:', req.body);
    
    // Validation
    if (!term_number || !term_name || !exam_month || !exam_year) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required: term_number, term_name, exam_month, exam_year' 
      });
    }
    
    // Validate term number (1, 2, or 3)
    if (term_number < 1 || term_number > 3) {
      return res.status(400).json({ success: false, error: 'Term number must be 1, 2, or 3' });
    }
    
    // Validate exam_month (1-12)
    if (exam_month < 1 || exam_month > 12) {
      return res.status(400).json({ success: false, error: 'Exam month must be between 1 and 12' });
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
    
    // Start transaction
    await db.execute('BEGIN');
    
    try {
      let termStatus = 'inactive';
      
      // If auto_set_active is true, deactivate all other terms first
      if (auto_set_active) {
        await db.execute('UPDATE terms SET status = $1 WHERE status = $2', ['inactive', 'active']);
        termStatus = 'active';
      }
      
      const sql = `
        INSERT INTO terms (term_number, term_name, exam_month, exam_year, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const result = await db.execute(sql, [term_number, term_name, exam_month, exam_year, termStatus]);
      
      await db.execute('COMMIT');
      console.log('Term created successfully:', result.rows[0]);
      res.status(201).json({ success: true, term: result.rows[0] });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating term:', error);
    res.status(500).json({ success: false, error: 'Failed to create term' });
  }
});

// POST /api/terms/bulk - Create all three terms for a year
router.post('/bulk', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { exam_year, term_names = ['First Term', 'Second Term', 'Third Term'], exam_months = [4, 8, 12] } = req.body;
    
    console.log('Bulk creating terms for year:', exam_year);
    
    if (!exam_year) {
      return res.status(400).json({ success: false, error: 'Exam year is required' });
    }
    
    // Check if any terms already exist for this year
    const existingTerms = await db.execute(
      'SELECT term_number FROM terms WHERE exam_year = $1',
      [exam_year]
    );
    
    if (existingTerms.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `Terms already exist for year ${exam_year}. Existing terms: ${existingTerms.rows.map(r => r.term_number).join(', ')}` 
      });
    }
    
    await db.execute('BEGIN');
    
    try {
      const createdTerms = [];
      
      for (let i = 1; i <= 3; i++) {
        const sql = `
          INSERT INTO terms (term_number, term_name, exam_month, exam_year, status)
          VALUES ($1, $2, $3, $4, 'inactive')
          RETURNING *
        `;
        
        const result = await db.execute(sql, [
          i,
          term_names[i - 1] || `Term ${i}`,
          exam_months[i - 1] || (i * 4),
          exam_year
        ]);
        
        createdTerms.push(result.rows[0]);
      }
      
      await db.execute('COMMIT');
      console.log('Bulk terms created successfully:', createdTerms);
      res.status(201).json({ success: true, terms: createdTerms });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error in bulk term creation:', error);
    res.status(500).json({ success: false, error: 'Failed to create bulk terms' });
  }
});

// GET /api/terms/current - Get current active term
router.get('/current', requireAuth, async (req, res) => {
  try {
    // First, try to get the term marked as 'active'
    let sql = `
      SELECT id, term_number, term_name, exam_month, exam_year, status, created_at
      FROM terms 
      WHERE status = 'active'
      ORDER BY exam_year DESC, term_number DESC
      LIMIT 1
    `;
    
    let result = await db.execute(sql);
    
    if (result.rows.length === 0) {
      // If no active term, get the most recent term
      sql = `
        SELECT id, term_number, term_name, exam_month, exam_year, status, created_at
        FROM terms 
        ORDER BY exam_year DESC, term_number DESC
        LIMIT 1
      `;
      
      result = await db.execute(sql);
    }
    
    res.json({ success: true, term: result.rows[0] || null });
  } catch (error) {
    console.error('Error fetching current term:', error);
    res.status(500).json({ success: false, error: 'Failed to load current term' });
  }
});

// PUT /api/terms/:id/set-current - Set a term as current active term
router.put('/:id/set-current', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Setting current term:', id);
    
    // Check if term exists
    const termExists = await db.execute('SELECT id FROM terms WHERE id = $1', [id]);
    if (termExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    await db.execute('BEGIN');
    
    try {
      // Set all terms to inactive
      await db.execute('UPDATE terms SET status = $1, updated_at = NOW()', ['inactive']);
      
      // Set the selected term as active
      await db.execute(
        'UPDATE terms SET status = $1, updated_at = NOW() WHERE id = $2',
        ['active', id]
      );
      
      await db.execute('COMMIT');
      
      // Get the updated term
      const result = await db.execute(
        'SELECT * FROM terms WHERE id = $1',
        [id]
      );
      
      console.log('Current term set successfully:', result.rows[0]);
      res.json({ success: true, term: result.rows[0] });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error setting current term:', error);
    res.status(500).json({ success: false, error: 'Failed to set current term' });
  }
});

// PUT /api/terms/:id - Update a term
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { term_name, exam_month, exam_year } = req.body;
    
    console.log('Updating term:', id, 'with data:', req.body);
    
    // Check if term exists
    const termExists = await db.execute('SELECT id, term_number FROM terms WHERE id = $1', [id]);
    if (termExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    // Check if marks exist for this term
    const marksExist = await db.execute('SELECT COUNT(*) as count FROM marks WHERE term_id = $1', [id]);
    if (marksExist.rows[0].count > 0 && exam_year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot change exam year for terms with existing marks' 
      });
    }
    
    // If changing exam_year, check for conflicts
    if (exam_year) {
      const currentTerm = termExists.rows[0];
      const conflictCheck = await db.execute(
        'SELECT id FROM terms WHERE term_number = $1 AND exam_year = $2 AND id != $3',
        [currentTerm.term_number, exam_year, id]
      );
      
      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({ 
          success: false, 
          error: `Term ${currentTerm.term_number} already exists for year ${exam_year}` 
        });
      }
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (term_name) {
      updates.push(`term_name = $${paramIndex}`);
      params.push(term_name);
      paramIndex++;
    }
    
    if (exam_month) {
      if (exam_month < 1 || exam_month > 12) {
        return res.status(400).json({ success: false, error: 'Exam month must be between 1 and 12' });
      }
      updates.push(`exam_month = $${paramIndex}`);
      params.push(exam_month);
      paramIndex++;
    }
    
    if (exam_year) {
      updates.push(`exam_year = $${paramIndex}`);
      params.push(exam_year);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(id);
    
    const sql = `UPDATE terms SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await db.execute(sql, params);
    console.log('Term updated successfully:', result.rows[0]);
    res.json({ success: true, term: result.rows[0] });
  } catch (error) {
    console.error('Error updating term:', error);
    res.status(500).json({ success: false, error: 'Failed to update term' });
  }
});

// DELETE /api/terms/:id - Delete a term (with safety checks)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.query;
    
    console.log('Deleting term:', id, 'force:', force);
    
    // Check if term exists
    const termExists = await db.execute('SELECT * FROM terms WHERE id = $1', [id]);
    if (termExists.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    const term = termExists.rows[0];
    
    // Check if marks exist for this term
    const marksCount = await db.execute('SELECT COUNT(*) as count FROM marks WHERE term_id = $1', [id]);
    const hasMarks = parseInt(marksCount.rows[0].count) > 0;
    
    if (hasMarks && !force) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete term "${term.term_name}". It has ${marksCount.rows[0].count} marks entries. Use force=true to delete anyway.`,
        marks_count: parseInt(marksCount.rows[0].count)
      });
    }
    
    await db.execute('BEGIN');
    
    try {
      // If forcing deletion, delete all related marks first
      if (hasMarks && force) {
        await db.execute('DELETE FROM marks WHERE term_id = $1', [id]);
      }
      
      // Delete the term
      await db.execute('DELETE FROM terms WHERE id = $1', [id]);
      
      await db.execute('COMMIT');
      console.log('Term deleted successfully:', id);
      res.json({ success: true, message: 'Term deleted successfully' });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting term:', error);
    res.status(500).json({ success: false, error: 'Failed to delete term' });
  }
});

// GET /api/terms/stats - Get comprehensive statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = {};
    
    // Basic counts
    const totalTerms = await db.execute('SELECT COUNT(*) as count FROM terms');
    stats.totalTerms = parseInt(totalTerms.rows[0].count);
    
    const activeTerms = await db.execute('SELECT COUNT(*) as count FROM terms WHERE status = $1', ['active']);
    stats.activeTerms = parseInt(activeTerms.rows[0].count);
    
    // Terms by year
    const termsByYear = await db.execute(`
      SELECT exam_year, COUNT(*) as count 
      FROM terms 
      GROUP BY exam_year 
      ORDER BY exam_year DESC
    `);
    stats.termsByYear = termsByYear.rows;
    
    // Terms by status
    const termsByStatus = await db.execute(`
      SELECT status, COUNT(*) as count 
      FROM terms 
      GROUP BY status
    `);
    stats.termsByStatus = termsByStatus.rows;
    
    // Current year terms
    const currentYear = new Date().getFullYear();
    const currentYearTerms = await db.execute(
      'SELECT COUNT(*) as count FROM terms WHERE exam_year = $1',
      [currentYear]
    );
    stats.currentYearTerms = parseInt(currentYearTerms.rows[0].count);
    
    // Terms with marks
    const termsWithMarks = await db.execute(`
      SELECT t.id, t.term_name, t.exam_year, t.term_number, COUNT(m.id) as marks_count
      FROM terms t
      LEFT JOIN marks m ON t.id = m.term_id
      GROUP BY t.id, t.term_name, t.exam_year, t.term_number
      HAVING COUNT(m.id) > 0
      ORDER BY t.exam_year DESC, t.term_number
    `);
    stats.termsWithMarks = termsWithMarks.rows;
    
    // Academic years coverage
    const academicYears = await db.execute(`
      SELECT exam_year,
             COUNT(*) as total_terms,
             COUNT(CASE WHEN status = 'active' THEN 1 END) as active_terms,
             MIN(term_number) as min_term,
             MAX(term_number) as max_term
      FROM terms 
      GROUP BY exam_year 
      ORDER BY exam_year DESC
    `);
    stats.academicYearsOverview = academicYears.rows;
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching term stats:', error);
    res.status(500).json({ success: false, error: 'Failed to load term statistics' });
  }
});

// POST /api/terms/:id/clone - Clone a term to a different year
router.post('/:id/clone', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { target_year, new_term_name } = req.body;
    
    console.log('Cloning term:', id, 'to year:', target_year);
    
    if (!target_year) {
      return res.status(400).json({ success: false, error: 'Target year is required' });
    }
    
    // Get the original term
    const originalTerm = await db.execute('SELECT * FROM terms WHERE id = $1', [id]);
    if (originalTerm.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    const term = originalTerm.rows[0];
    
    // Check if term already exists in target year
    const existingTerm = await db.execute(
      'SELECT id FROM terms WHERE term_number = $1 AND exam_year = $2',
      [term.term_number, target_year]
    );
    
    if (existingTerm.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: `Term ${term.term_number} already exists for year ${target_year}` 
      });
    }
    
    const sql = `
      INSERT INTO terms (term_number, term_name, exam_month, exam_year, status)
      VALUES ($1, $2, $3, $4, 'inactive')
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      term.term_number,
      new_term_name || term.term_name,
      term.exam_month,
      target_year
    ]);
    
    console.log('Term cloned successfully:', result.rows[0]);
    res.status(201).json({ success: true, term: result.rows[0] });
  } catch (error) {
    console.error('Error cloning term:', error);
    res.status(500).json({ success: false, error: 'Failed to clone term' });
  }
});

module.exports = router;