// backend/ecosystem.config.js - PM2 Configuration for Production
module.exports = {
  apps: [
    {
      name: 'attendance-backend',
      script: 'server.js',
      instances: 1, // Can be increased for load balancing
      exec_mode: 'fork', // or 'cluster' for multiple instances
      watch: false, // Set to true for development
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000
      },
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      // Auto restart on file changes (development only)
      ignore_watch: ['node_modules', 'logs'],
      // Health check
      health_check_grace_period: 10000,
      // Environment specific settings
      node_args: '--max-old-space-size=1024'
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/attendance-system.git',
      path: '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};