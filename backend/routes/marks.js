// backend/routes/marks.js - UPDATED VERSION WITH AB SUPPORT
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

// GET /api/marks - Get marks with filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    const { class: className, subject_id, term_id, student_id } = req.query;
    
    let sql = `
      SELECT m.*, s.name as student_name, s.index_number, 
             sub.subject_name, sub.subject_code, t.term_name, t.exam_year
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      JOIN terms t ON m.term_id = t.id
      WHERE s.status = 'active' AND sub.status = 'active'
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (className) {
      paramCount++;
      sql += ` AND s.current_class = $${paramCount}`;
      params.push(className);
    }
    
    if (subject_id) {
      paramCount++;
      sql += ` AND m.subject_id = $${paramCount}`;
      params.push(subject_id);
    }
    
    if (term_id) {
      paramCount++;
      sql += ` AND m.term_id = $${paramCount}`;
      params.push(term_id);
    }
    
    if (student_id) {
      paramCount++;
      sql += ` AND m.student_id = $${paramCount}`;
      params.push(student_id);
    }
    
    // Check if user has permission
    if (req.user.role !== 'admin') {
      // Teachers/coordinators can only see marks from their assigned class
      if (req.user.assignedClass) {
        if (className && className !== req.user.assignedClass) {
          return res.status(403).json({ 
            success: false, 
            error: 'Not authorized to view marks for this class' 
          });
        }
        
        paramCount++;
        sql += ` AND s.current_class = $${paramCount}`;
        params.push(req.user.assignedClass);
      }
    }
    
    sql += ' ORDER BY s.index_number, sub.subject_name';
    
    const result = await db.execute(sql, params);
    res.json({ success: true, marks: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/marks/bulk - Bulk enter marks
router.post('/bulk', requireAuth, async (req, res) => {
  try {
    const { marksData, term_id } = req.body;
    
    if (!marksData || !Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({ success: false, error: 'Marks data is required' });
    }
    
    // Validate each mark entry
    for (const mark of marksData) {
      const { student_id, subject_id, marks } = mark;
      
      if (!student_id || !subject_id || (marks === undefined || marks === null)) {
        return res.status(400).json({ success: false, error: 'Invalid mark data format' });
      }
      
      // Allow 'AB', 'ab', or whole numbers between 0 and 100
      if (typeof marks === 'string') {
        const upperMarks = marks.toUpperCase().trim();
        if (upperMarks !== 'AB') {
          return res.status(400).json({ success: false, error: 'String marks must be "AB" only' });
        }
      } else if (typeof marks === 'number') {
        if (!Number.isInteger(marks) || marks < 0 || marks > 100) {
          return res.status(400).json({ success: false, error: 'Marks must be whole numbers between 0 and 100 or "AB"' });
        }
      } else {
        return res.status(400).json({ success: false, error: 'Marks must be a whole number between 0 and 100 or "AB"' });
      }
    }
    
    // Get class information for permission checking
    const studentIds = marksData.map(m => m.student_id);
    const studentIdsPlaceholder = studentIds.map((_, i) => `$${i + 1}`).join(',');
    
    const studentsCheck = await db.execute(
      `SELECT id, current_class FROM students WHERE id IN (${studentIdsPlaceholder})`,
      studentIds
    );
    
    const studentClasses = {};
    studentsCheck.rows.forEach(student => {
      studentClasses[student.id] = student.current_class;
    });
    
    // Check if user has permission
    if (req.user.role !== 'admin') {
      // Teachers/coordinators can only enter marks for their assigned class
      if (req.user.assignedClass) {
        for (const mark of marksData) {
          const studentClass = studentClasses[mark.student_id];
          if (studentClass !== req.user.assignedClass) {
            return res.status(403).json({ 
              success: false, 
              error: `Not authorized to enter marks for student in class ${studentClass}` 
            });
          }
        }
      }
    }
    
    // Use transaction for bulk operations
    await db.execute('BEGIN');
    
    try {
      for (const mark of marksData) {
        const { student_id, subject_id, marks } = mark;
        
        // Check if mark already exists
        const existingCheck = await db.execute(
          'SELECT id FROM marks WHERE student_id = $1 AND subject_id = $2 AND term_id = $3',
          [student_id, subject_id, term_id]
        );
        
        // Convert 'AB' to NULL for database storage, keep integers as is
        const marksValue = (typeof marks === 'string' && marks.toUpperCase().trim() === 'AB') ? null : parseInt(marks);
        const statusValue = (typeof marks === 'string' && marks.toUpperCase().trim() === 'AB') ? 'absent' : 'active';

        if (existingCheck.rows.length > 0) {
          // Update existing mark
          await db.execute(
            'UPDATE marks SET marks = $1, teacher_id = $2, updated_at = NOW(), status = $4 WHERE id = $3',
            [marksValue, req.user.id, existingCheck.rows[0].id, statusValue]
          );
        } else {
          // Insert new mark
          await db.execute(
            'INSERT INTO marks (student_id, subject_id, term_id, marks, teacher_id, entry_date, status) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
            [student_id, subject_id, term_id, marksValue, req.user.id, statusValue]
          );
        }
      }
      
      await db.execute('COMMIT');
      res.json({ success: true, message: `${marksData.length} marks saved successfully` });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/student/:studentId/term/:termId', requireAuth, async (req, res) => {
  try {
    const { studentId, termId } = req.params;
    
    const sql = `
      SELECT m.*, s.subject_name, s.subject_code, s.stream
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      WHERE m.student_id = $1 AND m.term_id = $2
      ORDER BY s.subject_name
    `;
    
    const result = await db.execute(sql, [studentId, termId]);
    
    res.json({ success: true, marks: result.rows });
  } catch (error) {
    console.error('Error fetching student term marks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student term marks' });
  }
});

// Get highest mark for a subject in a specific term and class
router.get('/subject-highest/:termId/:classId/:subjectId', async (req, res) => {
  try {
    const { termId, classId, subjectId } = req.params;
    
    const highestMark = await Marks.findOne({
      where: { 
        term_id: termId,
        class_id: classId,
        subject_id: subjectId
      },
      attributes: [
        [sequelize.fn('MAX', sequelize.col('marks')), 'highestMark']
      ],
      raw: true
    });
    
    res.json({ success: true, data: { highestMark: highestMark.highestMark || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get class first average (without common subjects)
router.get('/class-first-average/:termId/:classId', async (req, res) => {
  try {
    const { termId, classId } = req.params;
    
    const firstAverage = await Marks.findOne({
      include: [{
        model: Subject,
        where: {
          stream: { [Op.ne]: 'common' }
        }
      }],
      where: { 
        term_id: termId,
        class_id: classId
      },
      attributes: [
        [sequelize.fn('MAX', sequelize.col('marks')), 'firstAverage']
      ],
      raw: true
    });
    
    res.json({ success: true, data: { firstAverage: firstAverage.firstAverage || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;