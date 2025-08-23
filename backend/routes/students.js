// backend/routes/students.js - UPDATED WITH INDEX_NUMBER SUBJECT ASSIGNMENT
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

// GET /api/students - Get all students
router.get('/', requireAuth, async (req, res) => {
  try {
    let sql = `
      SELECT id, index_number, name, name_with_initials, address, 
             mother_name, father_name, guardian_name,
             mother_phone, father_phone, guardian_phone,
             current_class, admission_year, status, created_at
      FROM students 
      WHERE status = 'active'
    `;
    
    const params = [];
    let paramCount = 0;
    
    // Admin can see all students, teachers/coordinators only see their assigned class
    if (req.user.role !== 'admin' && req.user.assignedClass) {
      sql += ` AND current_class = $${++paramCount}`;
      params.push(req.user.assignedClass);
    } else if (req.query.class) {
      // Admin can filter by class if needed
      sql += ` AND current_class = $${++paramCount}`;
      params.push(req.query.class);
    }
    
    sql += ' ORDER BY current_class, index_number';
    
    const result = await db.execute(sql, params);
    res.json({ success: true, students: result.rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students - Create new student
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { index_number, name, name_with_initials, address, mother_name, father_name, guardian_name,
            mother_phone, father_phone, guardian_phone, current_class, admission_year } = req.body;
    
    console.log('Creating student with data:', {
      index_number, name, current_class, admission_year
    });
    
    // Validate required fields
    if (!index_number || !name || !current_class) {
      return res.status(400).json({ 
        success: false, 
        error: 'Index number, name, and class are required' 
      });
    }
    
    // Check if student with same index number already exists
    const existingStudent = await db.execute(
      'SELECT id FROM students WHERE index_number = $1 AND status = \'active\'',
      [index_number]
    );
    
    if (existingStudent.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Student with this index number already exists' 
      });
    }
    
    const sql = `
      INSERT INTO students (index_number, name, name_with_initials, address, mother_name, father_name, guardian_name,
                           mother_phone, father_phone, guardian_phone, current_class, admission_year, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      index_number, 
      name, 
      name_with_initials || null, 
      address || null, 
      mother_name || null, 
      father_name || null, 
      guardian_name || null,
      mother_phone || null, 
      father_phone || null, 
      guardian_phone || null, 
      current_class, 
      admission_year || new Date().getFullYear()
    ]);
    
    console.log('Student created successfully:', result.rows[0]);
    
    res.status(201).json({ 
      success: true, 
      data: {
        student: result.rows[0]
      },
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/students/:id - Update student
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { index_number, name, name_with_initials, address, mother_name, father_name, guardian_name,
            mother_phone, father_phone, guardian_phone, current_class, admission_year, status } = req.body;
    
    // Validate required fields
    if (!index_number || !name || !current_class) {
      return res.status(400).json({ 
        success: false, 
        error: 'Index number, name, and class are required' 
      });
    }
    
    // Check if another student with the same index number already exists
    const existingStudent = await db.execute(
      'SELECT id FROM students WHERE index_number = $1 AND id != $2 AND status = \'active\'',
      [index_number, id]
    );
    
    if (existingStudent.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Another student with this index number already exists' 
      });
    }
    
    const sql = `
      UPDATE students 
      SET index_number = $1, name = $2, name_with_initials = $3, address = $4, mother_name = $5, father_name = $6, 
          guardian_name = $7, mother_phone = $8, father_phone = $9, guardian_phone = $10, 
          current_class = $11, admission_year = $12, status = $13, updated_at = NOW()
      WHERE id = $14
      RETURNING *
    `;
    
    const result = await db.execute(sql, [
      index_number, 
      name, 
      name_with_initials || null, 
      address || null, 
      mother_name || null, 
      father_name || null, 
      guardian_name || null,
      mother_phone || null, 
      father_phone || null, 
      guardian_phone || null, 
      current_class, 
      admission_year || new Date().getFullYear(),
      status || 'active',
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    res.json({ success: true, student: result.rows[0] });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/students/:id - Delete student
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if student exists
    const studentCheck = await db.execute('SELECT id FROM students WHERE id = $1', [id]);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
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
    
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
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
    
    // Validate student IDs
    const validStudentIds = studentIds.filter(id => Number.isInteger(id) && id > 0);
    if (validStudentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid student IDs provided' });
    }
    
    // Update student classes
    const placeholders = validStudentIds.map((_, i) => `$${i + 1}`).join(',');
    const updateSql = `
      UPDATE students 
      SET current_class = $${validStudentIds.length + 1}, updated_at = NOW()
      WHERE id IN (${placeholders}) AND current_class = $${validStudentIds.length + 2}
      RETURNING id, name, current_class
    `;
    
    const updateParams = [...validStudentIds, toClass, fromClass];
    const updateResult = await db.execute(updateSql, updateParams);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No students found with the specified criteria' 
      });
    }
    
    // Record promotion history
    const promotionRecords = updateResult.rows.map(student => [
      student.id, fromClass, toClass, academicYear, new Date()
    ]);
    
    if (promotionRecords.length > 0) {
      try {
        const promotionValues = promotionRecords.map((_, i) => 
          `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
        ).join(', ');
        
        const promotionSql = `
          INSERT INTO class_promotions (student_id, from_class, to_class, academic_year, promotion_date)
          VALUES ${promotionValues}
        `;
        
        const flatParams = promotionRecords.flat();
        await db.execute(promotionSql, flatParams);
      } catch (promotionError) {
        console.error('Error recording promotion history:', promotionError);
        // Continue even if promotion history fails
      }
    }
    
    res.json({ 
      success: true, 
      message: `Promoted ${updateResult.rows.length} students from ${fromClass} to ${toClass}`,
      promotedStudents: updateResult.rows 
    });
  } catch (error) {
    console.error('Error promoting students:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/students/:id/subjects - Assign subjects to a student (LEGACY - uses student ID)
router.post('/:id/subjects', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_ids, academic_year } = req.body;
    
    console.log('Assigning subjects to student (legacy method):', { 
      studentId: id, 
      subject_ids, 
      academic_year,
      subjectCount: subject_ids?.length 
    });
    
    // Validate input
    if (!subject_ids || !Array.isArray(subject_ids) || subject_ids.length === 0) {
      console.log('Invalid subject_ids:', subject_ids);
      return res.status(400).json({ 
        success: false, 
        error: 'Subject IDs array is required and must not be empty' 
      });
    }
    
    if (!academic_year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Academic year is required' 
      });
    }
    
    // Get student's index_number
    const studentCheck = await db.execute(
      'SELECT id, index_number, name FROM students WHERE id = $1 AND status = \'active\'', 
      [id]
    );
    
    if (studentCheck.rows.length === 0) {
      console.log('Student not found:', id);
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    const indexNumber = studentCheck.rows[0].index_number;
    console.log('Student found:', studentCheck.rows[0]);
    
    // Begin transaction
    await db.execute('BEGIN');
    
    try {
      // Delete existing subject assignments for this student and academic year
      const deleteResult = await db.execute(
        'DELETE FROM student_subjects WHERE index_number = $1 AND academic_year = $2',
        [indexNumber, academic_year]
      );
      
      console.log('Deleted existing assignments, rows affected:', deleteResult.rowCount);
      
      // Insert new subject assignments
      let insertedCount = 0;
      for (const subjectId of subject_ids) {
        // Check if subject exists
        const subjectCheck = await db.execute('SELECT id, subject_name FROM subjects WHERE id = $1', [subjectId]);
        if (subjectCheck.rows.length === 0) {
          console.log('Subject not found:', subjectId);
          await db.execute('ROLLBACK');
          return res.status(400).json({ 
            success: false, 
            error: `Subject with ID ${subjectId} not found` 
          });
        }
        
        console.log('Inserting subject assignment:', {
          indexNumber: indexNumber,
          subjectId: subjectId,
          subjectName: subjectCheck.rows[0].subject_name,
          academicYear: academic_year
        });
        
        const insertResult = await db.execute(
          'INSERT INTO student_subjects (index_number, subject_id, academic_year) VALUES ($1, $2, $3)',
          [indexNumber, subjectId, academic_year]
        );
        
        insertedCount++;
        console.log('Subject assignment inserted, rows affected:', insertResult.rowCount);
      }
      
      await db.execute('COMMIT');
      
      console.log('Successfully assigned', insertedCount, 'subjects to student:', id);
      
      res.json({ 
        success: true, 
        data: {
          assignedCount: insertedCount,
          studentId: id,
          indexNumber: indexNumber,
          academicYear: academic_year
        },
        message: `Successfully assigned ${insertedCount} subjects to student` 
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error assigning subjects to student:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// NEW: POST /api/students/subjects/assign-by-index - Assign subjects using index_number directly
router.post('/subjects/assign-by-index', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { index_number, subject_ids, academic_year } = req.body;
    
    console.log('Assigning subjects by index_number:', { 
      index_number, 
      subject_ids, 
      academic_year,
      subjectCount: subject_ids?.length 
    });
    
    // Validate input
    if (!index_number) {
      return res.status(400).json({ 
        success: false, 
        error: 'Index number is required' 
      });
    }
    
    if (!subject_ids || !Array.isArray(subject_ids)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject IDs array is required' 
      });
    }
    
    if (!academic_year) {
      return res.status(400).json({ 
        success: false, 
        error: 'Academic year is required' 
      });
    }
    
    // Check if student exists
    const studentCheck = await db.execute(
      'SELECT index_number, name FROM students WHERE index_number = $1 AND status = \'active\'', 
      [index_number]
    );
    
    if (studentCheck.rows.length === 0) {
      console.log('Student not found with index_number:', index_number);
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    console.log('Student found:', studentCheck.rows[0]);
    
    // Begin transaction
    await db.execute('BEGIN');
    
    try {
      // Delete existing subject assignments for this student and academic year
      const deleteResult = await db.execute(
        'DELETE FROM student_subjects WHERE index_number = $1 AND academic_year = $2',
        [index_number, academic_year]
      );
      
      console.log('Deleted existing assignments, rows affected:', deleteResult.rowCount);
      
      // Insert new subject assignments (if any)
      let insertedCount = 0;
      if (subject_ids.length > 0) {
        for (const subjectId of subject_ids) {
          // Check if subject exists
          const subjectCheck = await db.execute('SELECT id, subject_name FROM subjects WHERE id = $1', [subjectId]);
          if (subjectCheck.rows.length === 0) {
            console.log('Subject not found:', subjectId);
            await db.execute('ROLLBACK');
            return res.status(400).json({ 
              success: false, 
              error: `Subject with ID ${subjectId} not found` 
            });
          }
          
          console.log('Inserting subject assignment:', {
            indexNumber: index_number,
            subjectId: subjectId,
            subjectName: subjectCheck.rows[0].subject_name,
            academicYear: academic_year
          });
          
          const insertResult = await db.execute(
            'INSERT INTO student_subjects (index_number, subject_id, academic_year) VALUES ($1, $2, $3)',
            [index_number, subjectId, academic_year]
          );
          
          insertedCount++;
          console.log('Subject assignment inserted, rows affected:', insertResult.rowCount);
        }
      }
      
      await db.execute('COMMIT');
      
      console.log(`Successfully processed ${insertedCount} subject assignments for student:`, index_number);
      
      res.json({ 
        success: true, 
        data: {
          assignedCount: insertedCount,
          indexNumber: index_number,
          academicYear: academic_year,
          subjectIds: subject_ids
        },
        message: insertedCount > 0 
          ? `Successfully assigned ${insertedCount} subjects to student` 
          : 'Successfully cleared all subject assignments for student'
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error assigning subjects by index_number:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

module.exports = router;