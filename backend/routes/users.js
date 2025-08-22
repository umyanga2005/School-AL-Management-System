// backend/routes/users.js
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// -------------------- Authentication Middleware --------------------
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Access token is required' });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.userId,
      username: payload.username,
      role: payload.role,
      assignedClass: payload.assignedClass
    };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ success: false, error: 'Admin access required' });
};

// -------------------- Get All Users --------------------
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT id, username, role, full_name, assigned_class, temp_password, created_at
      FROM users 
      WHERE role != 'admin'
      ORDER BY created_at DESC
    `;
    const result = await db.execute(sql);
    const users = result.rows.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.full_name,
      assignedClass: user.assigned_class,
      tempPassword: user.temp_password,
      createdAt: user.created_at
    }));
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users: ' + error.message });
  }
});

// -------------------- Add New User --------------------
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, name, role, assignedClass } = req.body;

    if (!username || !name || !role) {
      return res.status(400).json({ success: false, error: 'Username, name, and role are required' });
    }

    if (!['teacher', 'coordinator'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Role must be either teacher or coordinator' });
    }

    const checkUserSql = 'SELECT COUNT(*) as count FROM users WHERE username = $1';
    const existingUser = await db.execute(checkUserSql, [username]);
    if (parseInt(existingUser.rows[0].count) > 0) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    // Generate temporary password for all new users
    const tempPassword = `${username}`;
    const passwordHash = crypto.createHash('sha256').update(tempPassword).digest('hex');

    const insertSql = `
      INSERT INTO users (username, password_hash, role, full_name, assigned_class, temp_password, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
      RETURNING id, username, role, full_name, assigned_class, temp_password, created_at
    `;

    const result = await db.execute(insertSql, [
      username,
      passwordHash,
      role,
      name,
      assignedClass || null
    ]);

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        name: newUser.full_name,
        assignedClass: newUser.assigned_class,
        tempPassword: newUser.temp_password,
        createdAt: newUser.created_at
      },
      tempPassword
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create user: ' + error.message });
  }
});

// -------------------- Update Teacher Class --------------------
router.put('/:id/update-class', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedClass } = req.body;

    console.log('🔄 Updating teacher class for ID:', id, 'to class:', assignedClass);

    if (!assignedClass) {
      return res.status(400).json({ success: false, error: 'Assigned class is required' });
    }

    // Verify user exists and is a teacher
    const checkUserSql = 'SELECT role FROM users WHERE id = $1';
    const userCheck = await db.execute(checkUserSql, [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (userCheck.rows[0].role !== 'teacher') {
      return res.status(400).json({ success: false, error: 'Only teacher class assignments can be updated' });
    }

    // Update the assigned class
    const updateSql = `
      UPDATE users
      SET assigned_class = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, role, full_name, assigned_class
    `;

    const result = await db.execute(updateSql, [assignedClass, id]);
    const updatedUser = result.rows[0];

    console.log('✅ Teacher class updated successfully:', updatedUser.username, 'assigned to:', assignedClass);

    res.json({
      success: true,
      message: 'Teacher class updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        name: updatedUser.full_name,
        assignedClass: updatedUser.assigned_class
      }
    });

  } catch (error) {
    console.error('❌ Error updating teacher class:', error);
    res.status(500).json({ success: false, error: 'Failed to update teacher class: ' + error.message });
  }
});

// -------------------- Update User Password --------------------
// This endpoint is used by users to update their own password
router.post('/:id/update-password', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 3) {
      return res.status(400).json({ success: false, error: 'New password must be at least 3 characters long' });
    }

    // Only allow the user themselves or admin to change
    if (req.user.id != id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to change this password' });
    }

    const passwordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    const updateSql = `
      UPDATE users
      SET password_hash = $1, temp_password = false, updated_at = NOW()
      WHERE id = $2
      RETURNING username
    `;

    const result = await db.execute(updateSql, [passwordHash, id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update password: ' + error.message });
  }
});

// -------------------- Delete User --------------------
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const attendanceCheckSql = 'SELECT COUNT(*) as count FROM attendance WHERE teacher_id = $1';
    const attendanceResult = await db.execute(attendanceCheckSql, [id]);
    if (parseInt(attendanceResult.rows[0].count) > 0) {
      return res.status(409).json({ success: false, error: 'Cannot delete user with existing attendance records' });
    }

    const deleteSql = `
      DELETE FROM users
      WHERE id = $1 AND role != 'admin'
      RETURNING username
    `;
    const result = await db.execute(deleteSql, [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user: ' + error.message });
  }
});

// -------------------- Test Endpoint --------------------
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Users route is working', timestamp: new Date().toISOString() });
});

module.exports = router;