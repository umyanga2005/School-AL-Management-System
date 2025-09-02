// backend/routes/reports.js - ENHANCED VERSION
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

// GET /api/reports/term-report - Enhanced with detailed mark sheet data
router.get('/term-report', requireAuth, async (req, res) => {
  try {
    const { term_id, class_name, include_common = 'true' } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    // Get term details first
    const termResult = await db.execute(
      'SELECT id, term_number, term_name, exam_year FROM terms WHERE id = $1',
      [term_id]
    );
    
    if (termResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    const term = termResult.rows[0];

    // backend/routes/reports.js - UPDATED SQL QUERY
    let sql = `
      SELECT 
        st.id as student_id,
        st.index_number,
        st.name_with_initials as student_name,
        st.current_class,
        s.id as subject_id,
        s.subject_code,
        s.subject_name,
        s.stream,
        COALESCE(m.marks, NULL) as marks,
        m.entry_date,
        u.username as teacher_username,
        u.full_name as teacher_name
      FROM students st
      CROSS JOIN subjects s
      LEFT JOIN marks m ON st.id = m.student_id AND m.subject_id = s.id AND m.term_id = $1
      LEFT JOIN users u ON m.teacher_id = u.id
      WHERE st.status = 'active' AND s.status = 'active'
    `;

    const params = [term_id];
    let paramIndex = 2;

    // If a class_name is provided, filter by that class
    if (class_name) {
      sql += ` AND st.current_class = $${paramIndex}`;
      params.push(class_name);
      paramIndex++;
    }

    // Filter out common subjects if requested
    if (include_common === 'false') {
      sql += ` AND s.stream != 'Common'`;
    }

    sql += ` ORDER BY st.current_class, st.index_number, s.stream, s.subject_name`;

    const result = await db.execute(sql, params);
    
    if (result.rows.length === 0) {
      return res.json({ 
        success: true, 
        term: term,
        students: [],
        summary: {
          totalStudents: 0,
          totalSubjects: 0,
          classAverage: 0,
          highestScore: 0,
          lowestScore: 0
        }
      });
    }

    // Process the data into a structured format
    const studentsData = {};
    const subjectsData = {};
    let classTotalMarks = 0;
    let classTotalStudents = 0;
    let highestScore = 0;
    let lowestScore = 100;

    // First, collect all subjects
    result.rows.forEach(row => {
      if (!subjectsData[row.subject_id]) {
        subjectsData[row.subject_id] = {
          id: row.subject_id,
          code: row.subject_code,
          name: row.subject_name,
          stream: row.stream,
          totalMarks: 0,
          studentCount: 0,
          average: 0
        };
      }
    });

    // Then process students and their marks
    result.rows.forEach(row => {
      // Track students (only once per student)
      if (!studentsData[row.student_id]) {
        studentsData[row.student_id] = {
          id: row.student_id,
          name: row.student_name,
          index_number: row.index_number,
          current_class: row.current_class,
          marks: [],
          totalMarks: 0,
          average: 0,
          rank: 0
        };
        classTotalStudents++;
      }

      // Add the mark to the student's mark list (even if null/absent)
      const markValue = row.marks !== null && row.marks !== '' ? parseFloat(row.marks) : null;
      
      studentsData[row.student_id].marks.push({
        subject_id: row.subject_id,
        subject_code: row.subject_code,
        subject_name: row.subject_name,
        stream: row.stream,
        marks: markValue,
        teacher: row.teacher_name || row.teacher_username,
        entry_date: row.entry_date,
        is_absent: markValue === null
      });

      // Update subject statistics only if mark exists
      if (markValue !== null) {
        subjectsData[row.subject_id].totalMarks += markValue;
        subjectsData[row.subject_id].studentCount++;

        // Update highest/lowest scores
        if (markValue > highestScore) highestScore = markValue;
        if (markValue < lowestScore) lowestScore = markValue;
      }
    });

    // Calculate student totals and averages
    let processedStudents = Object.values(studentsData);
    
    processedStudents.forEach(student => {
      // Calculate total marks (all subjects)
      student.totalMarks = student.marks.reduce((sum, m) => sum + (m.marks !== null ? m.marks : 0), 0);
      
      // Calculate average (only non-common subjects with actual marks)
      const nonCommonSubjectsWithMarks = student.marks.filter(m => m.stream !== 'Common' && m.marks !== null);
      if (nonCommonSubjectsWithMarks.length > 0) {
        const totalNonCommon = nonCommonSubjectsWithMarks.reduce((sum, m) => sum + m.marks, 0);
        student.average = parseFloat((totalNonCommon / nonCommonSubjectsWithMarks.length).toFixed(2));
      } else {
        student.average = 0;
      }
      
      classTotalMarks += student.totalMarks;
    });

    // Calculate student ranks
    processedStudents.sort((a, b) => b.totalMarks - a.totalMarks);
    
    let currentRank = 0;
    let lastTotal = -1;
    processedStudents.forEach((student, index) => {
      if (student.totalMarks !== lastTotal) {
        currentRank = index + 1;
        lastTotal = student.totalMarks;
      }
      student.rank = currentRank;
    });

    // Calculate subject averages
    Object.values(subjectsData).forEach(subject => {
      if (subject.studentCount > 0) {
        subject.average = parseFloat((subject.totalMarks / subject.studentCount).toFixed(2));
      }
    });

    // Calculate class average
    const classAverage = classTotalStudents > 0 
      ? parseFloat((classTotalMarks / classTotalStudents).toFixed(2)) 
      : 0;

    res.json({ 
      success: true, 
      term: term,
      students: processedStudents,
      subjects: Object.values(subjectsData),
      summary: {
        totalStudents: classTotalStudents,
        totalSubjects: Object.keys(subjectsData).length,
        classAverage: classAverage,
        highestScore: highestScore,
        lowestScore: lowestScore
      }
    });

  } catch (error) {
    console.error('Error generating term report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

// GET /api/reports/subject-analysis - Subject-wise analysis
router.get('/subject-analysis', requireAuth, async (req, res) => {
  try {
    const { term_id, class_name } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    const sql = `
      SELECT 
        s.id as subject_id,
        s.subject_code,
        s.subject_name,
        s.stream,
        COUNT(m.id) as student_count,
        ROUND(AVG(m.marks), 2) as average_marks,
        MAX(m.marks) as highest_marks,
        MIN(m.marks) as lowest_marks,
        COUNT(CASE WHEN m.marks >= 75 THEN 1 END) as distinction_count,
        COUNT(CASE WHEN m.marks >= 65 AND m.marks < 75 THEN 1 END) as credit_count,
        COUNT(CASE WHEN m.marks >= 50 AND m.marks < 65 THEN 1 END) as pass_count,
        COUNT(CASE WHEN m.marks < 50 THEN 1 END) as fail_count
      FROM marks m
      JOIN subjects s ON m.subject_id = s.id
      JOIN students st ON m.student_id = st.id
      WHERE m.term_id = $1 AND st.status = 'active' AND s.status = 'active'
    `;

    const params = [term_id];
    let paramIndex = 2;

    if (class_name) {
      sql += ` AND st.current_class = $${paramIndex}`;
      params.push(class_name);
      paramIndex++;
    }

    sql += ` GROUP BY s.id, s.subject_code, s.subject_name, s.stream
             ORDER BY s.stream, s.subject_name`;

    const result = await db.execute(sql, params);

    res.json({ success: true, subjectAnalysis: result.rows });

  } catch (error) {
    console.error('Error generating subject analysis:', error);
    res.status(500).json({ success: false, error: 'Failed to generate subject analysis' });
  }
});

// GET /api/reports/database-size - Get database size
router.get('/database-size', requireAuth, async (req, res) => {
  try {
    // Execute the SQL query to get database size
    const result = await db.execute(
      'SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size'
    );
    
    if (result.rows.length > 0) {
      res.json({ 
        success: true, 
        db_size: result.rows[0].db_size 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve database size' 
      });
    }
  } catch (error) {
    console.error('Error getting database size:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve database size' 
    });
  }
});

module.exports = router;
