// backend/routes/termAttendance.js - COMPLETE FIXED VERSION
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

const requireAdminOrCoordinator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin or coordinator access required' 
    });
  }
  next();
};

// GET /api/term-attendance/classes - Get all classes from students
router.get("/classes", requireAuth, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT DISTINCT current_class as class
      FROM students
      WHERE status = 'active' AND current_class IS NOT NULL AND current_class != ''
      ORDER BY current_class ASC
    `);

    const classes = result.rows.map(r => r.class).filter(cls => cls && cls.trim() !== '');
    
    res.json({ success: true, data: classes });
  } catch (err) {
    console.error("Error fetching classes:", err);
    res.status(500).json({ success: false, error: "Failed to fetch classes" });
  }
});

// GET /api/term-attendance/terms - Get all terms
router.get("/terms", requireAuth, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT id, term_name as name, term_number, exam_year, 
             CASE WHEN status = 'active' THEN true ELSE false END as is_active
      FROM terms
      ORDER BY exam_year DESC, term_number ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching terms:", err);
    res.status(500).json({ success: false, error: "Failed to fetch terms" });
  }
});

// GET /api/term-attendance/terms/active - Get active term
router.get("/terms/active", requireAuth, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT id, term_name as name, term_number, exam_year
      FROM terms
      WHERE status = 'active'
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null, message: "No active term found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error fetching active term:", err);
    res.status(500).json({ success: false, error: "Failed to fetch active term" });
  }
});

// GET /api/term-attendance/years - Get academic years
router.get("/years", requireAuth, async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT DISTINCT academic_year
      FROM (
        SELECT CAST(admission_year AS VARCHAR) as academic_year
        FROM students
        WHERE status = 'active'
        UNION
        SELECT CAST(exam_year AS VARCHAR) as academic_year
        FROM terms
        UNION
        SELECT DISTINCT academic_year
        FROM student_term_attendance
      ) AS all_years
      WHERE academic_year IS NOT NULL AND academic_year != ''
      ORDER BY academic_year DESC
    `);

    const years = result.rows.map(r => r.academic_year).filter(year => year);
    
    res.json({ success: true, data: years });
  } catch (err) {
    console.error("Error fetching years:", err);
    res.status(500).json({ success: false, error: "Failed to fetch years" });
  }
});

// GET /api/term-attendance/students/:class - Get students by class
router.get("/students/:class", requireAuth, async (req, res) => {
  const className = req.params.class;

  try {
    const result = await db.execute(
      `SELECT id, name, index_number, current_class as class 
       FROM students 
       WHERE current_class = $1 AND status = 'active'
       ORDER BY index_number ASC`,
      [className]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ success: false, error: "Failed to fetch students" });
  }
});

// GET /api/term-attendance - Get existing attendance
router.get("/", requireAuth, async (req, res) => {
  const { class: className, term_id, academic_year } = req.query;

  if (!className || !term_id || !academic_year) {
    return res.status(400).json({ 
      success: false, 
      error: "Class, term_id, and academic_year are required" 
    });
  }

  try {
    const result = await db.execute(`
      SELECT sta.*, s.name, s.index_number, s.current_class as class
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      WHERE s.current_class = $1 AND sta.term_id = $2 AND sta.academic_year = $3
      ORDER BY s.index_number ASC
    `, [className, term_id, academic_year]);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance" });
  }
});

// POST /api/term-attendance - Save attendance (bulk)
router.post("/", requireAuth, requireAdminOrCoordinator, async (req, res) => {
  const records = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: "Attendance records array is required" });
  }

  try {
    await db.execute('BEGIN');

    for (const record of records) {
      const {
        student_id,
        term_id,
        academic_year,
        total_school_days,
        attended_days,
        absent_days,
        attendance_percentage,
      } = record;

      await db.execute(
        `
        INSERT INTO student_term_attendance (
          student_id, term_id, academic_year,
          total_school_days, attended_days, absent_days, attendance_percentage
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (student_id, term_id, academic_year)
        DO UPDATE SET
          total_school_days = EXCLUDED.total_school_days,
          attended_days = EXCLUDED.attended_days,
          absent_days = EXCLUDED.absent_days,
          attendance_percentage = EXCLUDED.attendance_percentage,
          updated_at = NOW()
        `,
        [
          student_id,
          term_id,
          academic_year,
          total_school_days,
          attended_days,
          absent_days,
          attendance_percentage,
        ]
      );
    }

    await db.execute('COMMIT');
    res.json({ success: true, message: "Attendance saved successfully" });
  } catch (err) {
    await db.execute('ROLLBACK');
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, error: "Failed to save attendance" });
  }
});

// GET /api/term-attendance/stats - Get attendance statistics
router.get("/stats", requireAuth, async (req, res) => {
  const { class: className, term_id, academic_year } = req.query;

  try {
    let sql = `
      SELECT 
        COUNT(*) as total_records,
        AVG(attendance_percentage) as average_attendance,
        MIN(attendance_percentage) as min_attendance,
        MAX(attendance_percentage) as max_attendance,
        COUNT(CASE WHEN attendance_percentage >= 75 THEN 1 END) as good_attendance_count,
        COUNT(CASE WHEN attendance_percentage < 75 AND attendance_percentage >= 60 THEN 1 END) as average_attendance_count,
        COUNT(CASE WHEN attendance_percentage < 60 THEN 1 END) as poor_attendance_count
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (className) {
      paramCount++;
      sql += ` AND s.current_class = $${paramCount}`;
      params.push(className);
    }

    if (term_id) {
      paramCount++;
      sql += ` AND sta.term_id = $${paramCount}`;
      params.push(term_id);
    }

    if (academic_year) {
      paramCount++;
      sql += ` AND sta.academic_year = $${paramCount}`;
      params.push(academic_year);
    }

    const result = await db.execute(sql, params);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error fetching attendance stats:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance statistics" });
  }
});

module.exports = router;