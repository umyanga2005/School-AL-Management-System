// backend/routes/students.js - FIXED VERSION
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

const requireTeacherOrCoordinator = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'coordinator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Teacher or coordinator access required' 
    });
  }
  next();
};

// GET /api/students - Get all students
router.get('/', requireAuth, requireTeacherOrCoordinator, async (req, res) => {
  try {
    let sql = `
      SELECT id, index_number, name, address, 
             mother_name, father_name, guardian_name,
             mother_phone, father_phone, guardian_phone,
             current_class, admission_year, status, created_at
      FROM students 
      WHERE status = 'active'
    `;
    
    const params = [];
    
    // Filter by class if provided
    if (req.query.class) {
      sql += ' AND current_class = $1';
      params.push(req.query.class);
    }
    
    sql += ' ORDER BY current_class, index_number';
    
    const result = await db.execute(sql, params);
    res.json({ success: true, students: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students - Create new student
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { index_number, name, address, mother_name, father_name, guardian_name,
            mother_phone, father_phone, guardian_phone, current_class, admission_year } = req.body;
    
    const sql = `
      INSERT INTO students (index_number, name, address, mother_name, father_name, guardian_name,
                           mother_phone, father_phone, guardian_phone, current_class, admission_year, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      index_number, name, address, mother_name, father_name, guardian_name,
      mother_phone, father_phone, guardian_phone, current_class, admission_year || new Date().getFullYear()
    ]);
    
    res.status(201).json({ success: true, student: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { index_number, name, address, mother_name, father_name, guardian_name,
            mother_phone, father_phone, guardian_phone, current_class, admission_year, status } = req.body;
    
    const sql = `
      UPDATE students 
      SET index_number = $1, name = $2, address = $3, mother_name = $4, father_name = $5, 
          guardian_name = $6, mother_phone = $7, father_phone = $8, guardian_phone = $9, 
          current_class = $10, admission_year = $11, status = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      index_number, name, address, mother_name, father_name, guardian_name,
      mother_phone, father_phone, guardian_phone, current_class, admission_year, status, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({ success: true, student: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if student has marks records
    const marksCheck = await db.execute('SELECT COUNT(*) FROM marks WHERE student_id = $1', [id]);
    if (parseInt(marksCheck.rows[0].count) > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete student with marks records' });
    }
    
    // Soft delete by setting status to inactive
    const result = await db.execute(
      'UPDATE students SET status = \'inactive\', updated_at = NOW() WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students/promote-class - Promote students to next class
router.post('/promote-class', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { studentIds, fromClass, toClass, academicYear } = req.body;
    
    if (!studentIds || !studentIds.length || !fromClass || !toClass || !academicYear) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }
    
    // Update student classes
    const placeholders = studentIds.map((_, i) => `$${i + 1}`).join(',');
    const updateSql = `
      UPDATE students 
      SET current_class = $${studentIds.length + 1}, updated_at = NOW()
      WHERE id IN (${placeholders}) AND current_class = $${studentIds.length + 2}
      RETURNING id, name, current_class
    `;
    
    const updateParams = [...studentIds, toClass, fromClass];
    const updateResult = await db.execute(updateSql, updateParams);
    
    // Record promotion history
    const promotionRecords = updateResult.rows.map(student => [
      student.id, fromClass, toClass, academicYear, new Date()
    ]);
    
    if (promotionRecords.length > 0) {
      const promotionSql = `
        INSERT INTO class_promotions (student_id, from_class, to_class, academic_year, promotion_date)
        VALUES ${promotionRecords.map((_, i) => 
          `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
        ).join(', ')}
      `;
      
      const flatParams = promotionRecords.flat();
      await db.execute(promotionSql, flatParams);
    }
    
    res.json({ 
      success: true, 
      message: `Promoted ${updateResult.rows.length} students from ${fromClass} to ${toClass}`,
      promotedStudents: updateResult.rows 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;