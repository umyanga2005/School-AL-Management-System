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

  console.log("GET /api/term-attendance - Query params:", { className, term_id, academic_year });

  try {
    let sql = `
      SELECT sta.*, s.name, s.index_number, s.current_class as class
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      WHERE s.status = 'active'
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

    sql += ` ORDER BY s.index_number ASC`;

    console.log("Executing SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);

    console.log(`Found ${result.rows.length} attendance records`);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance" });
  }
});

// NEW: POST /api/term-attendance/students - Get attendance for specific students
router.post("/students", requireAuth, async (req, res) => {
  const { student_ids, term_id, academic_year } = req.body;

  console.log("POST /api/term-attendance/students - Body:", { student_ids, term_id, academic_year });

  if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: "student_ids array is required" 
    });
  }

  if (!term_id || !academic_year) {
    return res.status(400).json({ 
      success: false, 
      error: "term_id and academic_year are required" 
    });
  }

  try {
    // Create placeholders for student IDs
    const studentIdPlaceholders = student_ids.map((_, index) => `$${index + 3}`).join(',');
    
    const sql = `
      SELECT sta.*, s.name, s.index_number, s.current_class as class
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      WHERE sta.term_id = $1 
        AND sta.academic_year = $2 
        AND sta.student_id IN (${studentIdPlaceholders})
        AND s.status = 'active'
      ORDER BY s.index_number ASC
    `;

    const params = [term_id, academic_year, ...student_ids];

    console.log("Executing SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);

    console.log(`Found ${result.rows.length} attendance records for ${student_ids.length} students`);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching student attendance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch student attendance" });
  }
});

// NEW: GET /api/term-attendance/by-students - Get attendance by student IDs (alternative endpoint)
router.get("/by-students", requireAuth, async (req, res) => {
  const { student_ids, term_id, academic_year } = req.query;

  console.log("GET /api/term-attendance/by-students - Query params:", { student_ids, term_id, academic_year });

  if (!student_ids || !term_id || !academic_year) {
    return res.status(400).json({ 
      success: false, 
      error: "student_ids, term_id, and academic_year are required" 
    });
  }

  try {
    // Parse student_ids (could be comma-separated string)
    const studentIdArray = Array.isArray(student_ids) 
      ? student_ids 
      : student_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    if (studentIdArray.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Create placeholders for student IDs
    const studentIdPlaceholders = studentIdArray.map((_, index) => `$${index + 3}`).join(',');
    
    const sql = `
      SELECT sta.*, s.name, s.index_number, s.current_class as class
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      WHERE sta.term_id = $1 
        AND sta.academic_year = $2 
        AND sta.student_id IN (${studentIdPlaceholders})
        AND s.status = 'active'
      ORDER BY s.index_number ASC
    `;

    const params = [term_id, academic_year, ...studentIdArray];

    console.log("Executing SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);

    console.log(`Found ${result.rows.length} attendance records for ${studentIdArray.length} students`);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching attendance by students:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance by students" });
  }
});

// POST /api/term-attendance - Save attendance (bulk)
router.post("/", requireAuth, requireAdminOrCoordinator, async (req, res) => {
  const records = req.body;

  console.log("POST /api/term-attendance - Saving attendance records:", records?.length || 0);

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, error: "Attendance records array is required" });
  }

  try {
    await db.execute('BEGIN');

    let savedCount = 0;
    let updatedCount = 0;

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

      // Validate required fields
      if (!student_id || !term_id || !academic_year || total_school_days === undefined || attended_days === undefined) {
        await db.execute('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields in attendance record" 
        });
      }

      // Check if record exists
      const existingRecord = await db.execute(
        'SELECT id FROM student_term_attendance WHERE student_id = $1 AND term_id = $2 AND academic_year = $3',
        [student_id, term_id, academic_year]
      );

      if (existingRecord.rows.length > 0) {
        // Update existing record
        await db.execute(
          `UPDATE student_term_attendance SET
            total_school_days = $1,
            attended_days = $2,
            absent_days = $3,
            attendance_percentage = $4,
            updated_at = NOW()
           WHERE student_id = $5 AND term_id = $6 AND academic_year = $7`,
          [
            total_school_days,
            attended_days,
            absent_days,
            attendance_percentage,
            student_id,
            term_id,
            academic_year,
          ]
        );
        updatedCount++;
      } else {
        // Insert new record
        await db.execute(
          `INSERT INTO student_term_attendance (
            student_id, term_id, academic_year,
            total_school_days, attended_days, absent_days, attendance_percentage
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
        savedCount++;
      }
    }

    await db.execute('COMMIT');

    console.log(`Attendance saved: ${savedCount} new, ${updatedCount} updated`);

    res.json({ 
      success: true, 
      message: `Attendance saved successfully: ${savedCount} new records, ${updatedCount} updated records`,
      saved: savedCount,
      updated: updatedCount
    });
  } catch (err) {
    await db.execute('ROLLBACK');
    console.error("Error saving attendance:", err);
    res.status(500).json({ success: false, error: "Failed to save attendance" });
  }
});

// PUT /api/term-attendance/:id - Update single attendance record
router.put("/:id", requireAuth, requireAdminOrCoordinator, async (req, res) => {
  const { id } = req.params;
  const {
    total_school_days,
    attended_days,
    absent_days,
    attendance_percentage,
  } = req.body;

  console.log("PUT /api/term-attendance/:id - Updating record:", id);

  try {
    // Check if record exists
    const existingRecord = await db.execute(
      'SELECT id FROM student_term_attendance WHERE id = $1',
      [id]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Attendance record not found" });
    }

    // Update the record
    const result = await db.execute(
      `UPDATE student_term_attendance SET
        total_school_days = $1,
        attended_days = $2,
        absent_days = $3,
        attendance_percentage = $4,
        updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        total_school_days,
        attended_days,
        absent_days,
        attendance_percentage,
        id
      ]
    );

    console.log("Attendance record updated successfully:", result.rows[0]);

    res.json({ 
      success: true, 
      message: "Attendance record updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating attendance record:", err);
    res.status(500).json({ success: false, error: "Failed to update attendance record" });
  }
});

// DELETE /api/term-attendance/:id - Delete attendance record
router.delete("/:id", requireAuth, requireAdminOrCoordinator, async (req, res) => {
  const { id } = req.params;

  console.log("DELETE /api/term-attendance/:id - Deleting record:", id);

  try {
    // Check if record exists
    const existingRecord = await db.execute(
      'SELECT id, student_id, term_id, academic_year FROM student_term_attendance WHERE id = $1',
      [id]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Attendance record not found" });
    }

    // Delete the record
    await db.execute('DELETE FROM student_term_attendance WHERE id = $1', [id]);

    console.log("Attendance record deleted successfully:", existingRecord.rows[0]);

    res.json({ 
      success: true, 
      message: "Attendance record deleted successfully",
      deleted: existingRecord.rows[0]
    });
  } catch (err) {
    console.error("Error deleting attendance record:", err);
    res.status(500).json({ success: false, error: "Failed to delete attendance record" });
  }
});

// GET /api/term-attendance/stats - Get attendance statistics
router.get("/stats", requireAuth, async (req, res) => {
  const { class: className, term_id, academic_year } = req.query;

  console.log("GET /api/term-attendance/stats - Query params:", { className, term_id, academic_year });

  try {
    let sql = `
      SELECT 
        COUNT(*) as total_records,
        AVG(attendance_percentage) as average_attendance,
        MIN(attendance_percentage) as min_attendance,
        MAX(attendance_percentage) as max_attendance,
        COUNT(CASE WHEN attendance_percentage >= 75 THEN 1 END) as good_attendance_count,
        COUNT(CASE WHEN attendance_percentage < 75 AND attendance_percentage >= 60 THEN 1 END) as average_attendance_count,
        COUNT(CASE WHEN attendance_percentage < 60 THEN 1 END) as poor_attendance_count,
        AVG(total_school_days) as avg_school_days,
        AVG(attended_days) as avg_attended_days,
        AVG(absent_days) as avg_absent_days
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      WHERE s.status = 'active'
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

    console.log("Executing stats SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);
    
    const stats = result.rows[0];
    
    // Convert string values to numbers and handle nulls
    const processedStats = {
      total_records: parseInt(stats.total_records) || 0,
      average_attendance: parseFloat(stats.average_attendance) || 0,
      min_attendance: parseFloat(stats.min_attendance) || 0,
      max_attendance: parseFloat(stats.max_attendance) || 0,
      good_attendance_count: parseInt(stats.good_attendance_count) || 0,
      average_attendance_count: parseInt(stats.average_attendance_count) || 0,
      poor_attendance_count: parseInt(stats.poor_attendance_count) || 0,
      avg_school_days: parseFloat(stats.avg_school_days) || 0,
      avg_attended_days: parseFloat(stats.avg_attended_days) || 0,
      avg_absent_days: parseFloat(stats.avg_absent_days) || 0
    };

    console.log("Attendance stats:", processedStats);
    
    res.json({ success: true, data: processedStats });
  } catch (err) {
    console.error("Error fetching attendance stats:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance statistics" });
  }
});

// NEW: GET /api/term-attendance/summary - Get attendance summary by class and term
router.get("/summary", requireAuth, async (req, res) => {
  const { term_id, academic_year } = req.query;

  console.log("GET /api/term-attendance/summary - Query params:", { term_id, academic_year });

  try {
    let sql = `
      SELECT 
        s.current_class as class_name,
        COUNT(*) as total_students,
        AVG(sta.attendance_percentage) as class_average_attendance,
        COUNT(CASE WHEN sta.attendance_percentage >= 75 THEN 1 END) as good_attendance_count,
        COUNT(CASE WHEN sta.attendance_percentage < 75 AND sta.attendance_percentage >= 60 THEN 1 END) as average_attendance_count,
        COUNT(CASE WHEN sta.attendance_percentage < 60 THEN 1 END) as poor_attendance_count
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      WHERE s.status = 'active'
    `;
    
    const params = [];
    let paramCount = 0;

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

    sql += ` GROUP BY s.current_class ORDER BY s.current_class`;

    console.log("Executing summary SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);
    
    const summary = result.rows.map(row => ({
      class_name: row.class_name,
      total_students: parseInt(row.total_students) || 0,
      class_average_attendance: parseFloat(row.class_average_attendance) || 0,
      good_attendance_count: parseInt(row.good_attendance_count) || 0,
      average_attendance_count: parseInt(row.average_attendance_count) || 0,
      poor_attendance_count: parseInt(row.poor_attendance_count) || 0
    }));

    console.log("Attendance summary:", summary);
    
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error("Error fetching attendance summary:", err);
    res.status(500).json({ success: false, error: "Failed to fetch attendance summary" });
  }
});

// NEW: GET /api/term-attendance/student/:studentId - Get attendance for a specific student
router.get("/student/:studentId", requireAuth, async (req, res) => {
  const { studentId } = req.params;
  const { term_id, academic_year } = req.query;

  console.log("GET /api/term-attendance/student/:studentId - Params:", { studentId, term_id, academic_year });

  try {
    let sql = `
      SELECT sta.*, s.name, s.index_number, s.current_class as class,
             t.term_name, t.term_number, t.exam_year
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      LEFT JOIN terms t ON sta.term_id = t.id
      WHERE sta.student_id = $1 AND s.status = 'active'
    `;
    
    const params = [studentId];
    let paramCount = 1;

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

    sql += ` ORDER BY sta.academic_year DESC, t.term_number DESC`;

    console.log("Executing student attendance SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);

    console.log(`Found ${result.rows.length} attendance records for student ${studentId}`);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Error fetching student attendance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch student attendance" });
  }
});

// NEW: POST /api/term-attendance/calculate - Calculate attendance percentage
router.post("/calculate", requireAuth, async (req, res) => {
  const { total_school_days, attended_days } = req.body;

  console.log("POST /api/term-attendance/calculate - Body:", { total_school_days, attended_days });

  if (total_school_days === undefined || attended_days === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: "total_school_days and attended_days are required" 
    });
  }

  try {
    const totalDays = parseInt(total_school_days);
    const attendedDays = parseInt(attended_days);

    if (totalDays <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "total_school_days must be greater than 0" 
      });
    }

    if (attendedDays < 0 || attendedDays > totalDays) {
      return res.status(400).json({ 
        success: false, 
        error: "attended_days must be between 0 and total_school_days" 
      });
    }

    const absentDays = totalDays - attendedDays;
    const attendancePercentage = (attendedDays / totalDays) * 100;

    const result = {
      total_school_days: totalDays,
      attended_days: attendedDays,
      absent_days: absentDays,
      attendance_percentage: Math.round(attendancePercentage * 100) / 100 // Round to 2 decimal places
    };

    console.log("Calculated attendance:", result);
    
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error calculating attendance:", err);
    res.status(500).json({ success: false, error: "Failed to calculate attendance" });
  }
});

// NEW: GET /api/term-attendance/export - Export attendance data
router.get("/export", requireAuth, async (req, res) => {
  const { class: className, term_id, academic_year, format = 'json' } = req.query;

  console.log("GET /api/term-attendance/export - Query params:", { className, term_id, academic_year, format });

  try {
    let sql = `
      SELECT 
        s.index_number,
        s.name,
        s.current_class as class,
        t.term_name,
        t.term_number,
        t.exam_year,
        sta.academic_year,
        sta.total_school_days,
        sta.attended_days,
        sta.absent_days,
        sta.attendance_percentage,
        sta.created_at,
        sta.updated_at
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      LEFT JOIN terms t ON sta.term_id = t.id
      WHERE s.status = 'active'
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

    sql += ` ORDER BY s.current_class, s.index_number`;

    console.log("Executing export SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);

    console.log(`Exporting ${result.rows.length} attendance records`);

    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'Index Number', 'Name', 'Class', 'Term Name', 'Term Number', 'Exam Year',
        'Academic Year', 'Total School Days', 'Attended Days', 'Absent Days',
        'Attendance Percentage', 'Created At', 'Updated At'
      ];

      const csvRows = [
        headers.join(','),
        ...result.rows.map(row => [
          row.index_number,
          `"${row.name}"`,
          row.class,
          `"${row.term_name}"`,
          row.term_number,
          row.exam_year,
          row.academic_year,
          row.total_school_days,
          row.attended_days,
          row.absent_days,
          row.attendance_percentage,
          row.created_at,
          row.updated_at
        ].join(','))
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
      res.send(csvRows.join('\n'));
    } else {
      // Return JSON format
      res.json({ success: true, data: result.rows, count: result.rows.length });
    }
  } catch (err) {
    console.error("Error exporting attendance data:", err);
    res.status(500).json({ success: false, error: "Failed to export attendance data" });
  }
});

router.get("/student/:studentId/term/:termId", requireAuth, async (req, res) => {
  const { studentId, termId } = req.params;

  console.log("GET /api/term-attendance/student/:studentId/term/:termId - Params:", { studentId, termId });

  try {
    const sql = `
      SELECT sta.*, s.name, s.index_number, s.current_class as class,
             t.term_name, t.term_number, t.exam_year
      FROM student_term_attendance sta
      JOIN students s ON sta.student_id = s.id
      LEFT JOIN terms t ON sta.term_id = t.id
      WHERE sta.student_id = $1 AND sta.term_id = $2 AND s.status = 'active'
      LIMIT 1
    `;
    
    const params = [studentId, termId];

    console.log("Executing specific term attendance SQL:", sql, "with params:", params);

    const result = await db.execute(sql, params);

    if (result.rows.length === 0) {
      console.log(`No attendance record found for student ${studentId}, term ${termId}`);
      return res.json({ success: true, data: null });
    }

    console.log(`Found attendance record for student ${studentId}, term ${termId}`);
    
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Error fetching specific term attendance:", err);
    res.status(500).json({ success: false, error: "Failed to fetch specific term attendance" });
  }
});

module.exports = router;
