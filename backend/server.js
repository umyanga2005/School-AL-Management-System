// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDb } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.DEV_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');

// Import new routes
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const termRoutes = require('./routes/terms');
const marksRoutes = require('./routes/marks');
const reportsRoutes = require('./routes/reports');
const classRoutes = require('./routes/classes');
const savedReportsRoutes = require('./routes/savedReports');
const termAttendanceRoutes = require('./routes/termAttendance');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/saved-reports', savedReportsRoutes);
app.use('/api/term-attendance', termAttendanceRoutes); // Updated route
// Enhanced health check route
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbStatus = await db.testConnection();
    
    const healthInfo = {
      status: 'OK',
      message: 'Attendance Management System API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      database: {
        connected: dbStatus.connected,
        timestamp: dbStatus.timestamp || null,
        version: dbStatus.version ? dbStatus.version.split(' ')[0] : null,
        error: dbStatus.error || null
      }
    };

    // If database is not connected, return 503
    if (!dbStatus.connected) {
      return res.status(503).json({
        ...healthInfo,
        status: 'DEGRADED',
        message: 'API is running but database connection failed'
      });
    }

    res.json(healthInfo);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// System restart endpoint (for development and controlled environments)
app.post('/api/system/restart', (req, res) => {
  console.log('🔄 System restart requested');
  
  // Return immediate response
  res.json({
    success: true,
    message: 'System restart initiated',
    timestamp: new Date().toISOString(),
    pid: process.pid
  });

  // For development (local environment)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Restarting development server...');
    
    // Graceful shutdown with delay for response to be sent
    setTimeout(() => {
      console.log('👋 Shutting down for restart...');
      process.exit(0); // PM2 or nodemon will restart automatically
    }, 1000);
  } else {
    // For production (PM2 managed)
    console.log('🔄 Requesting PM2 restart...');
    
    setTimeout(() => {
      // Send signal to PM2 to restart this process
      process.kill(process.pid, 'SIGINT');
    }, 1000);
  }
});

// System info endpoint (additional debugging info)
app.get('/api/system/info', (req, res) => {
  res.json({
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
    memory_usage: process.memoryUsage(),
    cpu_usage: process.cpuUsage(),
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDb(); // ✅ Fixed function name
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔄 System Restart: http://localhost:${PORT}/api/system/restart`);
      console.log(`ℹ️  System Info: http://localhost:${PORT}/api/system/info`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✅ Database initialized successfully');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;