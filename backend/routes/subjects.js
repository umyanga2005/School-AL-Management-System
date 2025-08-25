// backend/routes/subjects.js - ENHANCED VERSION
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

// DELETE /api/subjects/:id - Delete subject (with assignment check)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Attempting to delete subject with ID:', id);
    
    // Check if subject exists
    const subjectCheck = await db.execute(
      'SELECT id, subject_name FROM subjects WHERE id = $1', 
      [id]
    );
    
    if (subjectCheck.rows.length === 0) {
      console.log('Subject not found:', id);
      return res.status(404).json({ 
        success: false, 
        error: 'Subject not found' 
      });
    }
    
    const subject = subjectCheck.rows[0];
    console.log('Found subject:', subject);
    
    // Check if subject is assigned to any students
    const assignmentCheck = await db.execute(
      'SELECT COUNT(*) as count FROM student_subjects WHERE subject_id = $1', 
      [id]
    );
    
    const assignmentCount = parseInt(assignmentCheck.rows[0].count);
    console.log('Subject assignment count:', assignmentCount);
    
    if (assignmentCount > 0) {
      console.log('Cannot delete subject - has assignments');
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete subject "${subject.subject_name}". It is assigned to ${assignmentCount} student(s). Please remove all student assignments first.`,
        details: {
          subjectName: subject.subject_name,
          assignmentCount: assignmentCount
        }
      });
    }
    
    // Check if subject has any marks records
    const marksCheck = await db.execute(
      'SELECT COUNT(*) as count FROM marks WHERE subject_id = $1', 
      [id]
    );
    
    const marksCount = parseInt(marksCheck.rows[0].count);
    console.log('Subject marks count:', marksCount);
    
    if (marksCount > 0) {
      console.log('Cannot delete subject - has marks records');
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete subject "${subject.subject_name}". It has ${marksCount} marks record(s). Please remove all marks first.`,
        details: {
          subjectName: subject.subject_name,
          marksCount: marksCount
        }
      });
    }
    
    // Safe to delete - soft delete by setting status to inactive
    const deleteResult = await db.execute(
      'UPDATE subjects SET status = \'inactive\', updated_at = NOW() WHERE id = $1 RETURNING id, subject_name',
      [id]
    );
    
    console.log('Subject deleted successfully:', deleteResult.rows[0]);
    
    res.json({ 
      success: true, 
      message: `Subject "${subject.subject_name}" deleted successfully`,
      data: {
        deletedSubject: deleteResult.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Check server logs for more information'
    });
  }
});

// GET /api/subjects/class/:className - Get subjects by class using student_subjects table
router.get('/class/:className', requireAuth, async (req, res) => {
  try {
    const { className } = req.params;
    const { academic_year } = req.query;
    
    console.log('Getting subjects for class:', className, 'academic year:', academic_year);
    
    // Check if user has permission
    if (req.user.role !== 'admin') {
      // Teachers/coordinators can only access their assigned class
      if (req.user.assignedClass && className !== req.user.assignedClass) {
        return res.status(403).json({ 
          success: false, 
          error: 'Not authorized to access subjects for this class' 
        });
      }
    }
    
    // Get current year if not provided
    const currentYear = academic_year || new Date().getFullYear();
    
    // Get subjects that students in this class are taking
    const sql = `
      SELECT DISTINCT s.id, s.subject_code, s.subject_name, s.stream, s.description
      FROM student_subjects ss
      JOIN subjects s ON ss.subject_id = s.id
      JOIN students st ON ss.index_number = st.index_number
      WHERE st.current_class = $1 
        AND ss.academic_year = $2 
        AND s.status = 'active'
        AND st.status = 'active'
      ORDER BY s.stream, s.subject_name
    `;
    
    const result = await db.execute(sql, [className, currentYear]);
    
    console.log(`Found ${result.rows.length} subjects for class ${className} in year ${currentYear}`);
    
    res.json({ 
      success: true, 
      subjects: result.rows,
      class: className,
      academicYear: currentYear
    });
  } catch (error) {
    console.error('Error getting subjects by class:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to retrieve subjects for the specified class'
    });
  }
});

// GET /api/subjects/class/:className/students - Get students and their subjects for a class
router.get('/class/:className/students', requireAuth, async (req, res) => {
  try {
    const { className } = req.params;
    const { academic_year } = req.query;
    
    console.log('Getting students and subjects for class:', className);
    
    // Check if user has permission
    if (req.user.role !== 'admin') {
      // Teachers/coordinators can only access their assigned class
      if (req.user.assignedClass && className !== req.user.assignedClass) {
        return res.status(403).json({ 
          success: false, 
          error: 'Not authorized to access this class data' 
        });
      }
    }
    
    // Get current year if not provided
    const currentYear = academic_year || new Date().getFullYear();
    
    // Get all students in the class
    const studentsSql = `
      SELECT id, index_number, name, current_class
      FROM students 
      WHERE current_class = $1 AND status = 'active'
      ORDER BY index_number
    `;
    
    const studentsResult = await db.execute(studentsSql, [className]);
    
    if (studentsResult.rows.length === 0) {
      return res.json({ 
        success: true, 
        students: [],
        class: className,
        academicYear: currentYear,
        message: 'No students found in this class'
      });
    }
    
    // Get subjects for each student
    const studentsWithSubjects = await Promise.all(
      studentsResult.rows.map(async (student) => {
        try {
          const subjectsSql = `
            SELECT s.id, s.subject_code, s.subject_name, s.stream
            FROM student_subjects ss
            JOIN subjects s ON ss.subject_id = s.id
            WHERE ss.index_number = $1 AND ss.academic_year = $2 AND s.status = 'active'
            ORDER BY s.stream, s.subject_name
          `;
          
          const subjectsResult = await db.execute(subjectsSql, [student.index_number, currentYear]);
          
          return {
            ...student,
            subjects: subjectsResult.rows
          };
        } catch (error) {
          console.error(`Error getting subjects for student ${student.index_number}:`, error);
          return {
            ...student,
            subjects: [],
            error: 'Failed to load subjects'
          };
        }
      })
    );
    
    console.log(`Retrieved ${studentsWithSubjects.length} students with subjects for class ${className}`);
    
    res.json({ 
      success: true, 
      students: studentsWithSubjects,
      class: className,
      academicYear: currentYear
    });
  } catch (error) {
    console.error('Error getting students and subjects by class:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to retrieve students and subjects for the specified class'
    });
  }
});

// GET /api/subjects/class/:className/subject-stats - Get subject statistics for a class
router.get('/class/:className/subject-stats', requireAuth, async (req, res) => {
  try {
    const { className } = req.params;
    const { academic_year } = req.query;
    
    console.log('Getting subject statistics for class:', className);
    
    // Check if user has permission
    if (req.user.role !== 'admin') {
      // Teachers/coordinators can only access their assigned class
      if (req.user.assignedClass && className !== req.user.assignedClass) {
        return res.status(403).json({ 
          success: false, 
          error: 'Not authorized to access this class data' 
        });
      }
    }
    
    // Get current year if not provided
    const currentYear = academic_year || new Date().getFullYear();
    
    // Get subject enrollment statistics
    const statsSql = `
      SELECT 
        s.id, 
        s.subject_code, 
        s.subject_name, 
        s.stream,
        COUNT(ss.index_number) as student_count,
        COUNT(DISTINCT st.id) as total_students,
        ROUND((COUNT(ss.index_number) * 100.0 / COUNT(DISTINCT st.id)), 2) as enrollment_percentage
      FROM subjects s
      CROSS JOIN (SELECT id FROM students WHERE current_class = $1 AND status = 'active') st
      LEFT JOIN student_subjects ss ON s.id = ss.subject_id 
        AND ss.academic_year = $2 
        AND ss.index_number IN (SELECT index_number FROM students WHERE current_class = $1 AND status = 'active')
      WHERE s.status = 'active'
      GROUP BY s.id, s.subject_code, s.subject_name, s.stream
      ORDER BY s.stream, s.subject_name
    `;
    
    const statsResult = await db.execute(statsSql, [className, currentYear]);
    
    // Get total students in class
    const totalStudentsSql = `
      SELECT COUNT(*) as total 
      FROM students 
      WHERE current_class = $1 AND status = 'active'
    `;
    
    const totalStudentsResult = await db.execute(totalStudentsSql, [className]);
    const totalStudents = parseInt(totalStudentsResult.rows[0].total);
    
    console.log(`Subject statistics retrieved for class ${className}: ${statsResult.rows.length} subjects`);
    
    res.json({ 
      success: true, 
      subjectStats: statsResult.rows,
      totalStudents: totalStudents,
      class: className,
      academicYear: currentYear
    });
  } catch (error) {
    console.error('Error getting subject statistics by class:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to retrieve subject statistics for the specified class'
    });
  }
});

module.exports = router;