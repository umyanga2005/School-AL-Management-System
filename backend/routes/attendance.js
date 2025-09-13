// backend/routes/attendance.js - Fixed Version
const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Fixed authentication middleware
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
    console.log('🎫 Verifying token for attendance route...');
    
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: parseInt(payload.userId), // IMPORTANT: Convert to integer
      username: payload.username,
      role: payload.role,
      assignedClass: payload.assignedClass
    };
    
    console.log('✅ Auth successful:', req.user.username, '(' + req.user.role + ')', 'ID:', req.user.id, 'Type:', typeof req.user.id);
    next();
  } catch (err) {
    console.error('❌ Auth failed:', err.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

// Teacher role check
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      success: false, 
      error: 'Teacher access required' 
    });
  }
  next();
};

// Teacher or Coordinator role check
const requireTeacherOrCoordinator = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'coordinator') {
    return res.status(403).json({ 
      success: false, 
      error: 'Teacher or coordinator access required' 
    });
  }
  next();
};

// GET /api/attendance - Fetch attendance records
router.get('/', requireAuth, requireTeacherOrCoordinator, async (req, res) => {
  try {
    console.log('📊 Fetching attendance records for:', req.user.username, '(', req.user.role, ')');
    console.log('👀 JWT user ID:', req.user.id, 'Type:', typeof req.user.id);

    let sql, params;

    if (req.user.role === 'teacher') {
      // Teachers see only their own records
      sql = `
        SELECT 
          a.id,
          a.date,
          a.class,
          a.boys_count AS boys,
          a.girls_count AS girls,
          (a.boys_count + a.girls_count) AS total,
          a.teacher_id,
          u.full_name AS teacherName,
          u.username,
          a.created_at
        FROM attendance a
        JOIN users u ON a.teacher_id = u.id
        WHERE a.teacher_id = $1
        ORDER BY a.date DESC, a.created_at DESC
      `;
      params = [req.user.id]; // Now this is properly an integer
    } else {
      // Coordinators see all records
      sql = `
        SELECT 
          a.id,
          a.date,
          a.class,
          a.boys_count AS boys,
          a.girls_count AS girls,
          (a.boys_count + a.girls_count) AS total,
          a.teacher_id,
          u.full_name AS teacherName,
          u.username,
          a.created_at
        FROM attendance a
        JOIN users u ON a.teacher_id = u.id
        ORDER BY a.date DESC, a.created_at DESC
      `;
      params = [];
    }

    console.log('🔍 Executing SQL:', sql);
    console.log('📝 With params:', params);

    const result = await db.execute(sql, params);

    console.log(`👀 Attendance rows returned: ${result.rows.length}`);
    
    // Debug: Log first few records to check data structure
    if (result.rows.length > 0) {
      console.log('📋 Sample record structure:', JSON.stringify(result.rows[0], null, 2));
    }

    res.json({
      success: true,
      records: result.rows
    });

  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch attendance records: ' + error.message
    });
  }
});


// POST /api/attendance - Teacher adds attendance (FIXED)
router.post('/', requireAuth, requireTeacher, async (req, res) => {
  try {
    const { date, class: className, boys, girls } = req.body;
    
    console.log('📝 Adding attendance record:', { 
      date, 
      className, 
      boys, 
      girls, 
      teacherId: req.user.id,
      teacherName: req.user.username
    });

    // Validation
    if (!date || !className || boys === undefined || girls === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Date, class, boys count, and girls count are required' 
      });
    }

    const boysCount = parseInt(boys);
    const girlsCount = parseInt(girls);

    if (isNaN(boysCount) || isNaN(girlsCount)) {
      return res.status(400).json({
        success: false,
        error: 'Boys and girls counts must be valid numbers'
      });
    }

    if (boysCount < 0 || girlsCount < 0) {
      return res.status(400).json({
        success: false,
        error: 'Student counts cannot be negative'
      });
    }

    // Check if attendance already exists for this date/class/teacher
    const checkSql = `
      SELECT COUNT(*) as count 
      FROM attendance 
      WHERE date = $1 AND class = $2 AND teacher_id = $3
    `;
    
    const checkResult = await db.execute(checkSql, [date, className, req.user.id]);
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        error: 'Attendance record already exists for this date and class'
      });
    }

    // Insert attendance record
    const insertSql = `
      INSERT INTO attendance (date, class, boys_count, girls_count, teacher_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING 
        id,
        date,
        class,
        boys_count as boys,
        girls_count as girls,
        (boys_count + girls_count) as total,
        teacher_id,
        created_at
    `;
    
    console.log('🔍 Executing insert:', insertSql);
    console.log('📝 With params:', [date, className, boysCount, girlsCount, req.user.id]);
    
    const result = await db.execute(insertSql, [
      date, 
      className, 
      boysCount, 
      girlsCount, 
      req.user.id
    ]);
    
    const newRecord = result.rows[0];
    
    // Add teacher name to response
    newRecord.teacherName = req.user.username;
    
    console.log('✅ Attendance record created:', newRecord.id);
    
    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      ...newRecord
    });

  } catch (error) {
    console.error('❌ Error creating attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record attendance: ' + error.message
    });
  }
});

// PUT /api/attendance/:id - Update attendance record
router.put('/:id', requireAuth, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    const { boys, girls, class: className } = req.body;
    
    console.log('✏️ Updating attendance record:', id);

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (boys !== undefined) {
      const boysCount = parseInt(boys);
      if (isNaN(boysCount) || boysCount < 0) {
        return res.status(400).json({
          success: false,
          error: 'Boys count must be a valid non-negative number'
        });
      }
      updates.push(`boys_count = $${paramIndex++}`);
      params.push(boysCount);
    }

    if (girls !== undefined) {
      const girlsCount = parseInt(girls);
      if (isNaN(girlsCount) || girlsCount < 0) {
        return res.status(400).json({
          success: false,
          error: 'Girls count must be a valid non-negative number'
        });
      }
      updates.push(`girls_count = $${paramIndex++}`);
      params.push(girlsCount);
    }

    if (className) {
      updates.push(`class = $${paramIndex++}`);
      params.push(className);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id, req.user.id);

    const updateSql = `
      UPDATE attendance 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex++} AND teacher_id = $${paramIndex}
      RETURNING 
        id,
        date,
        class,
        boys_count as boys,
        girls_count as girls,
        (boys_count + girls_count) as total,
        updated_at
    `;
    
    const result = await db.execute(updateSql, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found or unauthorized'
      });
    }

    console.log('✅ Attendance record updated:', id);
    
    res.json({
      success: true,
      message: 'Attendance updated successfully',
      record: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update attendance: ' + error.message
    });
  }
});

// DELETE /api/attendance/:id - Delete attendance record
router.delete('/:id', requireAuth, requireTeacher, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Deleting attendance record:', id);

    const deleteSql = `
      DELETE FROM attendance 
      WHERE id = $1 AND teacher_id = $2
      RETURNING id, date, class
    `;
    
    const result = await db.execute(deleteSql, [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Attendance record not found or unauthorized'
      });
    }

    console.log('✅ Attendance record deleted:', id);
    
    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete attendance: ' + error.message
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Attendance test endpoint hit');
  res.json({
    success: true,
    message: 'Attendance route is working',
    timestamp: new Date().toISOString()
  });
});

// Get class attendance statistics
router.get('/class-stats/:classId/:termId/:year', async (req, res) => {
  try {
    const { classId, termId, year } = req.params;
    
    const stats = await TermAttendance.findOne({
      where: { 
        class_id: classId,
        term_id: termId,
        academic_year: year
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('total_school_days')), 'avg_school_days'],
        [sequelize.fn('AVG', sequelize.col('absent_days')), 'avg_absent_days']
      ],
      raw: true
    });
    
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;