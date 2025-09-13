const express = require('express');
const router = express.Router();
const { db } = require('../config/database'); // using db wrapper

// GET /api/academic-records/:studentId/:className/:termId/:year
router.get('/:studentId/:className/:termId/:year', async (req, res) => {
  try {
    const { studentId, className, termId, year } = req.params;

    // Student marks
    const marksRes = await db.query(
      `SELECT m.marks, m.subject_id, s.subject_name, s.stream
       FROM marks m
       JOIN subjects s ON m.subject_id = s.id
       WHERE m.student_id = $1 AND m.term_id = $2
       ORDER BY s.stream, s.subject_name`,
      [studentId, termId]
    );

    // Highest marks per subject
    const highestMarks = {};
    for (const row of marksRes.rows) {
      const highRes = await db.query(
        `SELECT MAX(marks) as highest
         FROM marks
         WHERE term_id = $1 AND subject_id = $2`,
        [termId, row.subject_id]
      );
      highestMarks[row.subject_id] = highRes.rows[0].highest || 0;
    }

    // Attendance
    const attendanceRes = await db.query(
      `SELECT * FROM student_term_attendance
       WHERE student_id = $1 AND term_id = $2 AND academic_year = $3`,
      [studentId, termId, year]
    );
    const attendance = attendanceRes.rows[0] || null;

    // Class students list (from students table)
    const classStudentsRes = await db.query(
      `SELECT id FROM students WHERE current_class = $1`,
      [className]
    );
    const classStudentIds = classStudentsRes.rows.map((r) => r.id);

    // Total marks per student in the class for this term
    const totalsRes = await db.query(
      `SELECT m.student_id, SUM(m.marks) as total
       FROM marks m
       WHERE m.term_id = $1 AND m.student_id = ANY($2)
       GROUP BY m.student_id
       ORDER BY total DESC`,
      [termId, classStudentIds]
    );

    const totals = totalsRes.rows.map((r) => ({
      student_id: r.student_id,
      total: Number(r.total),
    }));

    // Rank calculation
    let studentRank = null;
    const sorted = totals.sort((a, b) => b.total - a.total);
    sorted.forEach((row, idx) => {
      if (row.student_id == studentId) {
        studentRank = idx + 1;
      }
    });

    // Class first average (highest student's average excluding common subjects)
    let firstAverage = 0;
    if (sorted.length > 0) {
      const topStudentId = sorted[0].student_id;
      const topMarksRes = await db.query(
        `SELECT m.marks, s.stream
         FROM marks m
         JOIN subjects s ON m.subject_id = s.id
         WHERE m.student_id = $1 AND m.term_id = $2`,
        [topStudentId, termId]
      );
      const nonCommon = topMarksRes.rows.filter(
        (s) => s.stream && s.stream.toLowerCase() !== 'common'
      );
      if (nonCommon.length > 0) {
        const total = nonCommon.reduce((sum, s) => sum + Number(s.marks || 0), 0);
        firstAverage = Math.round(total / nonCommon.length);
      }
    }

    res.json({
      success: true,
      data: {
        marks: marksRes.rows,
        highestMarks,
        attendance,
        classStats: { firstAverage, studentRank },
      },
    });
  } catch (err) {
    console.error('Academic Records error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
