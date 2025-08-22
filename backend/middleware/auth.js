// backend/middleware/auth.js - Fixed Version
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware: Verify JWT token and attach user to request
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
    console.log('🎫 Verifying token...');
    
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.userId,
      username: payload.username,
      role: payload.role,
      assignedClass: payload.assignedClass
    };
    
    console.log('✅ Auth successful for:', req.user.username, '(' + req.user.role + ')');
    next();
  } catch (err) {
    console.error('❌ Auth failed:', err.message);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

// Middleware: Admin only
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin access required' 
    });
  }
  next();
};

// Middleware: Teacher only
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      success: false,
      error: 'Teacher access required' 
    });
  }
  next();
};

// Middleware: Coordinator only
const requireCoordinator = (req, res, next) => {
  if (req.user.role !== 'coordinator') {
    return res.status(403).json({ 
      success: false,
      error: 'Coordinator access required' 
    });
  }
  next();
};

// Middleware: Teacher or Coordinator
const requireTeacherOrCoordinator = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'coordinator') {
    return res.status(403).json({ 
      success: false,
      error: 'Teacher or coordinator access required' 
    });
  }
  next();
};

// Middleware: Admin or Coordinator
const requireAdminOrCoordinator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'coordinator') {
    return res.status(403).json({ 
      success: false,
      error: 'Admin or coordinator access required' 
    });
  }
  next();
};

// Optional: Attach full user info from DB (if needed)
const attachUser = async (req, res, next) => {
  if (!req.user) return next();
  
  try {
    const result = await db.execute(
      'SELECT id, username, full_name, role, assigned_class FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length > 0) {
      req.user = { ...req.user, ...result.rows[0] };
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
  }
  
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireTeacher,
  requireCoordinator,
  requireTeacherOrCoordinator,
  requireAdminOrCoordinator,
  attachUser
};