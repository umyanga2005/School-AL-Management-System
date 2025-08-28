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
    const { term_id, class_name, grade_level, stream_filter, include_common = 'true', academic_year } = req.query;

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

    // Build the main query to get all marks data
    let sql = `
      SELECT 
        st.id as student_id,
        st.index_number,
        st.name as student_name,
        st.current_class,
        s.id as subject_id,
        s.subject_code,
        s.subject_name,
        s.stream,
        m.marks,
        m.entry_date,
        u.username as teacher_username,
        u.full_name as teacher_name
      FROM students st
      JOIN marks m ON st.id = m.student_id
      JOIN subjects s ON m.subject_id = s.id
      LEFT JOIN users u ON m.teacher_id = u.id
      WHERE m.term_id = $1 AND st.status = 'active' AND s.status = 'active'
    `;

    const params = [term_id];
    let paramIndex = 2;

    // Apply filters
    if (class_name) {
      sql += ` AND st.current_class = $${paramIndex}`;
      params.push(class_name);
      paramIndex++;
    }
    
    if (grade_level) {
      sql += ` AND st.current_class LIKE $${paramIndex}`;
      params.push(`${grade_level}%`);
      paramIndex++;
    }
    
    if (stream_filter) {
      sql += ` AND s.stream = $${paramIndex}`;
      params.push(stream_filter);
      paramIndex++;
    }
    
    // Filter out common subjects if requested
    if (include_common === 'false') {
      sql += ` AND s.stream != 'Common'`;
    }
    
    // Filter by academic year if provided
    if (academic_year) {
      sql += ` AND st.admission_year = $${paramIndex}`;
      params.push(parseInt(academic_year));
      paramIndex++;
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

    result.rows.forEach(row => {
      // Track subjects
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

      // Track students
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

      // Add the mark to the student's mark list
      const markValue = parseFloat(row.marks);
      studentsData[row.student_id].marks.push({
        subject_id: row.subject_id,
        subject_code: row.subject_code,
        subject_name: row.subject_name,
        stream: row.stream,
        marks: markValue,
        teacher: row.teacher_name || row.teacher_username,
        entry_date: row.entry_date
      });

      // Update subject statistics
      subjectsData[row.subject_id].totalMarks += markValue;
      subjectsData[row.subject_id].studentCount++;

      // Update highest/lowest scores
      if (markValue > highestScore) highestScore = markValue;
      if (markValue < lowestScore) lowestScore = markValue;
    });

    // Calculate student totals and averages
    let processedStudents = Object.values(studentsData);
    
    processedStudents.forEach(student => {
      // Calculate total marks (all subjects)
      student.totalMarks = student.marks.reduce((sum, m) => sum + m.marks, 0);
      
      // Calculate average (only non-common subjects)
      const nonCommonSubjects = student.marks.filter(m => m.stream !== 'Common');
      if (nonCommonSubjects.length > 0) {
        const totalNonCommon = nonCommonSubjects.reduce((sum, m) => sum + m.marks, 0);
        student.average = parseFloat((totalNonCommon / nonCommonSubjects.length).toFixed(2));
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
    const { term_id, class_name, grade_level, stream_filter, include_common = 'true', academic_year } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    let sql = `
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
    
    if (grade_level) {
      sql += ` AND st.current_class LIKE $${paramIndex}`;
      params.push(`${grade_level}%`);
      paramIndex++;
    }
    
    if (stream_filter) {
      sql += ` AND s.stream = $${paramIndex}`;
      params.push(stream_filter);
      paramIndex++;
    }
    
    // Filter out common subjects if requested
    if (include_common === 'false') {
      sql += ` AND s.stream != 'Common'`;
    }
    
    // Filter by academic year if provided
    if (academic_year) {
      sql += ` AND st.admission_year = $${paramIndex}`;
      params.push(parseInt(academic_year));
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

// NEW: GET /api/reports/performance-trends - Performance trends across terms
router.get('/performance-trends', requireAuth, async (req, res) => {
  try {
    const { student_id, class_name, subject_id, academic_year } = req.query;

    let sql = `
      SELECT 
        t.id as term_id,
        t.term_name,
        t.term_number,
        t.exam_year,
        AVG(m.marks) as average_marks,
        COUNT(m.id) as marks_count
      FROM terms t
      LEFT JOIN marks m ON t.id = m.term_id
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE s.status = 'active' AND sub.status = 'active'
    `;

    const params = [];
    let paramIndex = 1;
    const conditions = [];

    if (student_id) {
      conditions.push(`s.id = $${paramIndex}`);
      params.push(student_id);
      paramIndex++;
    }

    if (class_name) {
      conditions.push(`s.current_class = $${paramIndex}`);
      params.push(class_name);
      paramIndex++;
    }

    if (subject_id) {
      conditions.push(`sub.id = $${paramIndex}`);
      params.push(subject_id);
      paramIndex++;
    }

    if (academic_year) {
      conditions.push(`t.exam_year = $${paramIndex}`);
      params.push(parseInt(academic_year));
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    sql += ` GROUP BY t.id, t.term_name, t.term_number, t.exam_year
             ORDER BY t.exam_year, t.term_number`;

    const result = await db.execute(sql, params);
    res.json({ success: true, trends: result.rows });

  } catch (error) {
    console.error('Error generating performance trends:', error);
    res.status(500).json({ success: false, error: 'Failed to generate performance trends' });
  }
});

// NEW: GET /api/reports/class-comparison - Compare classes performance
router.get('/class-comparison', requireAuth, async (req, res) => {
  try {
    const { term_id, grade_level, include_common = 'true' } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    let sql = `
      SELECT 
        s.current_class,
        COUNT(DISTINCT s.id) as student_count,
        ROUND(AVG(m.marks), 2) as class_average,
        MAX(m.marks) as highest_score,
        MIN(m.marks) as lowest_score,
        COUNT(CASE WHEN m.marks >= 50 THEN 1 END) as pass_count,
        COUNT(CASE WHEN m.marks < 50 THEN 1 END) as fail_count,
        ROUND((COUNT(CASE WHEN m.marks >= 50 THEN 1 END) * 100.0 / COUNT(m.id)), 2) as pass_percentage
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
    `;

    const params = [term_id];
    let paramIndex = 2;

    if (grade_level) {
      sql += ` AND s.current_class LIKE $${paramIndex}`;
      params.push(`${grade_level}%`);
      paramIndex++;
    }

    // Filter out common subjects if requested
    if (include_common === 'false') {
      sql += ` AND sub.stream != 'Common'`;
    }

    sql += ` GROUP BY s.current_class
             ORDER BY s.current_class`;

    const result = await db.execute(sql, params);
    res.json({ success: true, classComparison: result.rows });

  } catch (error) {
    console.error('Error generating class comparison:', error);
    res.status(500).json({ success: false, error: 'Failed to generate class comparison' });
  }
});

// NEW: GET /api/reports/student-progress - Individual student progress
router.get('/student-progress', requireAuth, async (req, res) => {
  try {
    const { student_id, academic_year } = req.query;

    if (!student_id) {
      return res.status(400).json({ success: false, error: 'Student ID is required' });
    }

    let sql = `
      SELECT 
        t.id as term_id,
        t.term_name,
        t.term_number,
        t.exam_year,
        sub.subject_name,
        sub.subject_code,
        sub.stream,
        m.marks,
        m.entry_date,
        u.full_name as teacher_name
      FROM marks m
      JOIN terms t ON m.term_id = t.id
      JOIN subjects sub ON m.subject_id = sub.id
      LEFT JOIN users u ON m.teacher_id = u.id
      WHERE m.student_id = $1 AND sub.status = 'active'
    `;

    const params = [student_id];
    let paramIndex = 2;

    if (academic_year) {
      sql += ` AND t.exam_year = $${paramIndex}`;
      params.push(parseInt(academic_year));
      paramIndex++;
    }

    sql += ` ORDER BY t.exam_year, t.term_number, sub.stream, sub.subject_name`;

    const result = await db.execute(sql, params);

    // Process the data to calculate progress
    const progressData = {};
    result.rows.forEach(row => {
      const termKey = `${row.exam_year}-T${row.term_number}`;
      
      if (!progressData[termKey]) {
        progressData[termKey] = {
          term_id: row.term_id,
          term_name: row.term_name,
          term_number: row.term_number,
          exam_year: row.exam_year,
          subjects: [],
          total_marks: 0,
          average: 0,
          subject_count: 0
        };
      }
      
      progressData[termKey].subjects.push({
        subject_name: row.subject_name,
        subject_code: row.subject_code,
        stream: row.stream,
        marks: row.marks,
        teacher_name: row.teacher_name,
        entry_date: row.entry_date
      });
      
      progressData[termKey].total_marks += parseFloat(row.marks);
      progressData[termKey].subject_count++;
    });

    // Calculate averages
    Object.keys(progressData).forEach(key => {
      if (progressData[key].subject_count > 0) {
        progressData[key].average = parseFloat(
          (progressData[key].total_marks / progressData[key].subject_count).toFixed(2)
        );
      }
    });

    // Get student info
    const studentInfo = await db.execute(
      'SELECT id, name, index_number, current_class, admission_year FROM students WHERE id = $1',
      [student_id]
    );

    res.json({ 
      success: true, 
      student: studentInfo.rows[0] || {},
      progress: Object.values(progressData)
    });

  } catch (error) {
    console.error('Error generating student progress report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate student progress report' });
  }
});

// NEW: GET /api/reports/grade-distribution - Grade distribution analysis
router.get('/grade-distribution', requireAuth, async (req, res) => {
  try {
    const { term_id, class_name, subject_id, grade_level, stream_filter } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    let sql = `
      SELECT 
        CASE 
          WHEN m.marks >= 75 THEN 'A (75-100)'
          WHEN m.marks >= 65 THEN 'B (65-74)'
          WHEN m.marks >= 50 THEN 'C (50-64)'
          WHEN m.marks >= 35 THEN 'S (35-49)'
          ELSE 'F (0-34)'
        END as grade_band,
        COUNT(*) as student_count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM marks m2 
                                   JOIN students s2 ON m2.student_id = s2.id 
                                   JOIN subjects sub2 ON m2.subject_id = sub2.id
                                   WHERE m2.term_id = $1 AND s2.status = 'active' AND sub2.status = 'active'
                                   ${class_name ? 'AND s2.current_class = $2' : ''})), 2) as percentage
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
    `;

    const params = [term_id];
    let paramIndex = 2;

    if (class_name) {
      sql = sql.replace('$2', `$${paramIndex}`);
      params.push(class_name);
      paramIndex++;
    }

    if (subject_id) {
      sql += ` AND sub.id = $${paramIndex}`;
      params.push(subject_id);
      paramIndex++;
    }

    if (grade_level) {
      sql += ` AND s.current_class LIKE $${paramIndex}`;
      params.push(`${grade_level}%`);
      paramIndex++;
    }

    if (stream_filter) {
      sql += ` AND sub.stream = $${paramIndex}`;
      params.push(stream_filter);
      paramIndex++;
    }

    sql += ` GROUP BY grade_band
             ORDER BY 
               CASE grade_band
                 WHEN 'A (75-100)' THEN 1
                 WHEN 'B (65-74)' THEN 2
                 WHEN 'C (50-64)' THEN 3
                 WHEN 'S (35-49)' THEN 4
                 ELSE 5
               END`;

    const result = await db.execute(sql, params);
    res.json({ success: true, gradeDistribution: result.rows });

  } catch (error) {
    console.error('Error generating grade distribution:', error);
    res.status(500).json({ success: false, error: 'Failed to generate grade distribution' });
  }
});

// NEW: GET /api/reports/export-data - Data for export functionality
router.get('/export-data', requireAuth, async (req, res) => {
  try {
    const { term_id, class_name, export_type = 'detailed' } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    // Get term details
    const termResult = await db.execute(
      'SELECT id, term_number, term_name, exam_year FROM terms WHERE id = $1',
      [term_id]
    );
    
    if (termResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    const term = termResult.rows[0];

    // Build query based on export type
    let sql = '';
    const params = [term_id];
    let paramIndex = 2;

    if (export_type === 'summary') {
      sql = `
        SELECT 
          s.current_class,
          COUNT(DISTINCT s.id) as student_count,
          COUNT(DISTINCT sub.id) as subject_count,
          ROUND(AVG(m.marks), 2) as class_average,
          MAX(m.marks) as highest_score,
          MIN(m.marks) as lowest_score,
          COUNT(CASE WHEN m.marks >= 50 THEN 1 END) as pass_count,
          COUNT(CASE WHEN m.marks < 50 THEN 1 END) as fail_count,
          ROUND((COUNT(CASE WHEN m.marks >= 50 THEN 1 END) * 100.0 / COUNT(m.id)), 2) as pass_percentage
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
      `;

      if (class_name) {
        sql += ` AND s.current_class = $${paramIndex}`;
        params.push(class_name);
        paramIndex++;
      }

      sql += ` GROUP BY s.current_class
               ORDER BY s.current_class`;

      const result = await db.execute(sql, params);
      
      res.json({ 
        success: true, 
        term: term,
        export_type: 'summary',
        data: result.rows 
      });

    } else if (export_type === 'subject_wise') {
      sql = `
        SELECT 
          sub.subject_code,
          sub.subject_name,
          sub.stream,
          s.current_class,
          COUNT(m.id) as student_count,
          ROUND(AVG(m.marks), 2) as average_marks,
          MAX(m.marks) as highest_marks,
          MIN(m.marks) as lowest_marks,
          COUNT(CASE WHEN m.marks >= 75 THEN 1 END) as distinction_count,
          COUNT(CASE WHEN m.marks >= 65 AND m.marks < 75 THEN 1 END) as credit_count,
          COUNT(CASE WHEN m.marks >= 50 AND m.marks < 65 THEN 1 END) as pass_count,
          COUNT(CASE WHEN m.marks < 50 THEN 1 END) as fail_count
        FROM marks m
        JOIN subjects sub ON m.subject_id = sub.id
        JOIN students s ON m.student_id = s.id
        WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
      `;

      if (class_name) {
        sql += ` AND s.current_class = $${paramIndex}`;
        params.push(class_name);
        paramIndex++;
      }

      sql += ` GROUP BY sub.subject_code, sub.subject_name, sub.stream, s.current_class
               ORDER BY sub.stream, sub.subject_name, s.current_class`;

      const result = await db.execute(sql, params);
      
      res.json({ 
        success: true, 
        term: term,
        export_type: 'subject_wise',
        data: result.rows 
      });

    } else {
      // Default: detailed export
      sql = `
        SELECT 
          s.current_class,
          s.index_number,
          s.name as student_name,
          sub.subject_code,
          sub.subject_name,
          sub.stream,
          m.marks,
          u.full_name as teacher_name,
          m.entry_date
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        LEFT JOIN users u ON m.teacher_id = u.id
        WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
      `;

      if (class_name) {
        sql += ` AND s.current_class = $${paramIndex}`;
        params.push(class_name);
        paramIndex++;
      }

      sql += ` ORDER BY s.current_class, s.index_number, sub.stream, sub.subject_name`;

      const result = await db.execute(sql, params);
      
      res.json({ 
        success: true, 
        term: term,
        export_type: 'detailed',
        data: result.rows 
      });
    }

  } catch (error) {
    console.error('Error generating export data:', error);
    res.status(500).json({ success: false, error: 'Failed to generate export data' });
  }
});

// NEW: GET /api/reports/performance-trends - Performance trends across terms
router.get('/performance-trends', requireAuth, async (req, res) => {
  try {
    const { student_id, class_name, subject_id, academic_year } = req.query;

    let sql = `
      SELECT 
        t.id as term_id,
        t.term_name,
        t.term_number,
        t.exam_year,
        AVG(m.marks) as average_marks,
        COUNT(m.id) as marks_count
      FROM terms t
      LEFT JOIN marks m ON t.id = m.term_id
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE s.status = 'active' AND sub.status = 'active'
    `;

    const params = [];
    let paramIndex = 1;
    const conditions = [];

    if (student_id) {
      conditions.push(`s.id = $${paramIndex}`);
      params.push(student_id);
      paramIndex++;
    }

    if (class_name) {
      conditions.push(`s.current_class = $${paramIndex}`);
      params.push(class_name);
      paramIndex++;
    }

    if (subject_id) {
      conditions.push(`sub.id = $${paramIndex}`);
      params.push(subject_id);
      paramIndex++;
    }

    if (academic_year) {
      conditions.push(`t.exam_year = $${paramIndex}`);
      params.push(parseInt(academic_year));
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    sql += ` GROUP BY t.id, t.term_name, t.term_number, t.exam_year
             ORDER BY t.exam_year, t.term_number`;

    const result = await db.execute(sql, params);
    res.json({ success: true, trends: result.rows });

  } catch (error) {
    console.error('Error generating performance trends:', error);
    res.status(500).json({ success: false, error: 'Failed to generate performance trends' });
  }
});

// NEW: GET /api/reports/class-comparison - Compare classes performance
router.get('/class-comparison', requireAuth, async (req, res) => {
  try {
    const { term_id, grade_level, include_common = 'true' } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    let sql = `
      SELECT 
        s.current_class,
        COUNT(DISTINCT s.id) as student_count,
        ROUND(AVG(m.marks), 2) as class_average,
        MAX(m.marks) as highest_score,
        MIN(m.marks) as lowest_score,
        COUNT(CASE WHEN m.marks >= 50 THEN 1 END) as pass_count,
        COUNT(CASE WHEN m.marks < 50 THEN 1 END) as fail_count,
        ROUND((COUNT(CASE WHEN m.marks >= 50 THEN 1 END) * 100.0 / COUNT(m.id)), 2) as pass_percentage
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
    `;

    const params = [term_id];
    let paramIndex = 2;

    if (grade_level) {
      sql += ` AND s.current_class LIKE $${paramIndex}`;
      params.push(`${grade_level}%`);
      paramIndex++;
    }

    // Filter out common subjects if requested
    if (include_common === 'false') {
      sql += ` AND sub.stream != 'Common'`;
    }

    sql += ` GROUP BY s.current_class
             ORDER BY s.current_class`;

    const result = await db.execute(sql, params);
    res.json({ success: true, classComparison: result.rows });

  } catch (error) {
    console.error('Error generating class comparison:', error);
    res.status(500).json({ success: false, error: 'Failed to generate class comparison' });
  }
});

// NEW: GET /api/reports/student-progress - Individual student progress
router.get('/student-progress', requireAuth, async (req, res) => {
  try {
    const { student_id, academic_year } = req.query;

    if (!student_id) {
      return res.status(400).json({ success: false, error: 'Student ID is required' });
    }

    let sql = `
      SELECT 
        t.id as term_id,
        t.term_name,
        t.term_number,
        t.exam_year,
        sub.subject_name,
        sub.subject_code,
        sub.stream,
        m.marks,
        m.entry_date,
        u.full_name as teacher_name
      FROM marks m
      JOIN terms t ON m.term_id = t.id
      JOIN subjects sub ON m.subject_id = sub.id
      LEFT JOIN users u ON m.teacher_id = u.id
      WHERE m.student_id = $1 AND sub.status = 'active'
    `;

    const params = [student_id];
    let paramIndex = 2;

    if (academic_year) {
      sql += ` AND t.exam_year = $${paramIndex}`;
      params.push(parseInt(academic_year));
      paramIndex++;
    }

    sql += ` ORDER BY t.exam_year, t.term_number, sub.stream, sub.subject_name`;

    const result = await db.execute(sql, params);

    // Process the data to calculate progress
    const progressData = {};
    result.rows.forEach(row => {
      const termKey = `${row.exam_year}-T${row.term_number}`;
      
      if (!progressData[termKey]) {
        progressData[termKey] = {
          term_id: row.term_id,
          term_name: row.term_name,
          term_number: row.term_number,
          exam_year: row.exam_year,
          subjects: [],
          total_marks: 0,
          average: 0,
          subject_count: 0
        };
      }
      
      progressData[termKey].subjects.push({
        subject_name: row.subject_name,
        subject_code: row.subject_code,
        stream: row.stream,
        marks: row.marks,
        teacher_name: row.teacher_name,
        entry_date: row.entry_date
      });
      
      progressData[termKey].total_marks += parseFloat(row.marks);
      progressData[termKey].subject_count++;
    });

    // Calculate averages
    Object.keys(progressData).forEach(key => {
      if (progressData[key].subject_count > 0) {
        progressData[key].average = parseFloat(
          (progressData[key].total_marks / progressData[key].subject_count).toFixed(2)
        );
      }
    });

    // Get student info
    const studentInfo = await db.execute(
      'SELECT id, name, index_number, current_class, admission_year FROM students WHERE id = $1',
      [student_id]
    );

    res.json({ 
      success: true, 
      student: studentInfo.rows[0] || {},
      progress: Object.values(progressData)
    });

  } catch (error) {
    console.error('Error generating student progress report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate student progress report' });
  }
});

// NEW: GET /api/reports/grade-distribution - Grade distribution analysis
router.get('/grade-distribution', requireAuth, async (req, res) => {
  try {
    const { term_id, class_name, subject_id, grade_level, stream_filter } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    let sql = `
      SELECT 
        CASE 
          WHEN m.marks >= 75 THEN 'A (75-100)'
          WHEN m.marks >= 65 THEN 'B (65-74)'
          WHEN m.marks >= 50 THEN 'C (50-64)'
          WHEN m.marks >= 35 THEN 'S (35-49)'
          ELSE 'F (0-34)'
        END as grade_band,
        COUNT(*) as student_count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM marks m2 
                                   JOIN students s2 ON m2.student_id = s2.id 
                                   JOIN subjects sub2 ON m2.subject_id = sub2.id
                                   WHERE m2.term_id = $1 AND s2.status = 'active' AND sub2.status = 'active'
                                   ${class_name ? 'AND s2.current_class = $2' : ''})), 2) as percentage
      FROM marks m
      JOIN students s ON m.student_id = s.id
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
    `;

    const params = [term_id];
    let paramIndex = 2;

    if (class_name) {
      sql = sql.replace('$2', `$${paramIndex}`);
      params.push(class_name);
      paramIndex++;
    }

    if (subject_id) {
      sql += ` AND sub.id = $${paramIndex}`;
      params.push(subject_id);
      paramIndex++;
    }

    if (grade_level) {
      sql += ` AND s.current_class LIKE $${paramIndex}`;
      params.push(`${grade_level}%`);
      paramIndex++;
    }

    if (stream_filter) {
      sql += ` AND sub.stream = $${paramIndex}`;
      params.push(stream_filter);
      paramIndex++;
    }

    sql += ` GROUP BY grade_band
             ORDER BY 
               CASE grade_band
                 WHEN 'A (75-100)' THEN 1
                 WHEN 'B (65-74)' THEN 2
                 WHEN 'C (50-64)' THEN 3
                 WHEN 'S (35-49)' THEN 4
                 ELSE 5
               END`;

    const result = await db.execute(sql, params);
    res.json({ success: true, gradeDistribution: result.rows });

  } catch (error) {
    console.error('Error generating grade distribution:', error);
    res.status(500).json({ success: false, error: 'Failed to generate grade distribution' });
  }
});

// NEW: GET /api/reports/export-data - Data for export functionality
router.get('/export-data', requireAuth, async (req, res) => {
  try {
    const { term_id, class_name, export_type = 'detailed' } = req.query;

    if (!term_id) {
      return res.status(400).json({ success: false, error: 'Term ID is required' });
    }

    // Get term details
    const termResult = await db.execute(
      'SELECT id, term_number, term_name, exam_year FROM terms WHERE id = $1',
      [term_id]
    );
    
    if (termResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Term not found' });
    }
    
    const term = termResult.rows[0];

    // Build query based on export type
    let sql = '';
    const params = [term_id];
    let paramIndex = 2;

    if (export_type === 'summary') {
      sql = `
        SELECT 
          s.current_class,
          COUNT(DISTINCT s.id) as student_count,
          COUNT(DISTINCT sub.id) as subject_count,
          ROUND(AVG(m.marks), 2) as class_average,
          MAX(m.marks) as highest_score,
          MIN(m.marks) as lowest_score,
          COUNT(CASE WHEN m.marks >= 50 THEN 1 END) as pass_count,
          COUNT(CASE WHEN m.marks < 50 THEN 1 END) as fail_count,
          ROUND((COUNT(CASE WHEN m.marks >= 50 THEN 1 END) * 100.0 / COUNT(m.id)), 2) as pass_percentage
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
      `;

      if (class_name) {
        sql += ` AND s.current_class = $${paramIndex}`;
        params.push(class_name);
        paramIndex++;
      }

      sql += ` GROUP BY s.current_class
               ORDER BY s.current_class`;

      const result = await db.execute(sql, params);
      
      res.json({ 
        success: true, 
        term: term,
        export_type: 'summary',
        data: result.rows 
      });

    } else if (export_type === 'subject_wise') {
      sql = `
        SELECT 
          sub.subject_code,
          sub.subject_name,
          sub.stream,
          s.current_class,
          COUNT(m.id) as student_count,
          ROUND(AVG(m.marks), 2) as average_marks,
          MAX(m.marks) as highest_marks,
          MIN(m.marks) as lowest_marks,
          COUNT(CASE WHEN m.marks >= 75 THEN 1 END) as distinction_count,
          COUNT(CASE WHEN m.marks >= 65 AND m.marks < 75 THEN 1 END) as credit_count,
          COUNT(CASE WHEN m.marks >= 50 AND m.marks < 65 THEN 1 END) as pass_count,
          COUNT(CASE WHEN m.marks < 50 THEN 1 END) as fail_count
        FROM marks m
        JOIN subjects sub ON m.subject_id = sub.id
        JOIN students s ON m.student_id = s.id
        WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
      `;

      if (class_name) {
        sql += ` AND s.current_class = $${paramIndex}`;
        params.push(class_name);
        paramIndex++;
      }

      sql += ` GROUP BY sub.subject_code, sub.subject_name, sub.stream, s.current_class
               ORDER BY sub.stream, sub.subject_name, s.current_class`;

      const result = await db.execute(sql, params);
      
      res.json({ 
        success: true, 
        term: term,
        export_type: 'subject_wise',
        data: result.rows 
      });

    } else {
      // Default: detailed export
      sql = `
        SELECT 
          s.current_class,
          s.index_number,
          s.name as student_name,
          sub.subject_code,
          sub.subject_name,
          sub.stream,
          m.marks,
          u.full_name as teacher_name,
          m.entry_date
        FROM marks m
        JOIN students s ON m.student_id = s.id
        JOIN subjects sub ON m.subject_id = sub.id
        LEFT JOIN users u ON m.teacher_id = u.id
        WHERE m.term_id = $1 AND s.status = 'active' AND sub.status = 'active'
      `;

      if (class_name) {
        sql += ` AND s.current_class = $${paramIndex}`;
        params.push(class_name);
        paramIndex++;
      }

      sql += ` ORDER BY s.current_class, s.index_number, sub.stream, sub.subject_name`;

      const result = await db.execute(sql, params);
      
      res.json({ 
        success: true, 
        term: term,
        export_type: 'detailed',
        data: result.rows 
      });
    }

  } catch (error) {
    console.error('Error generating export data:', error);
    res.status(500).json({ success: false, error: 'Failed to generate export data' });
  }
});

module.exports = router;