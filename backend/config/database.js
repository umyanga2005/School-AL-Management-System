// backend/config/database.js - Fixed Version
const { Client } = require('pg');

let db;

try {
  const dbConfig = {
    host: process.env.DB_HOST || '',
    port: process.env.DB_PORT || '',
    database: process.env.DB_NAME || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log("🔹 Connecting to database:", {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: '***' // Don't log password
  });

  db = new Client(dbConfig);
  
  // Connect with proper error handling
  db.connect()
    .then(() => {
      console.log("✅ Supabase PostgreSQL client connected successfully.");
    })
    .catch((error) => {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    });

} catch (error) {
  console.error("❌ Failed to create database client:", error);
  process.exit(1);
}

// Simple initialization function that doesn't create tables
const initDb = async () => {
  try {
    console.log("🔹 Checking database connection...");
    
    // Simple connection test
    const result = await db.query('SELECT NOW()');
    console.log("✅ Database connection verified at:", result.rows[0].now);
    
    console.log("✅ Database initialization completed!");
    console.log("\n📋 Make sure your tables exist in Supabase:");
    console.log("👤 Required tables: users, attendance");
    console.log("🔗 Access your Supabase dashboard to verify table structure");
    
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

// Enhanced wrapper functions with better error handling
const dbWrapper = {
  execute: async (sql, params = []) => {
    // Enhanced validation
    if (!sql) {
      console.error('❌ SQL query is null or undefined');
      throw new Error('SQL query cannot be null or undefined');
    }
    
    if (typeof sql !== 'string') {
      console.error('❌ SQL query must be a string, received:', typeof sql);
      throw new Error('SQL query must be a string');
    }
    
    const trimmedSql = sql.trim();
    if (trimmedSql === '') {
      console.error('❌ SQL query is empty after trimming');
      throw new Error('SQL query cannot be empty');
    }
    
    // Log the query for debugging
    console.log('🔍 Executing SQL:', trimmedSql.substring(0, 100) + (trimmedSql.length > 100 ? '...' : ''));
    if (params && params.length > 0) {
      console.log('🔍 With params:', params);
    }
    
    try {
      const result = await db.query(trimmedSql, params);
      console.log('✅ SQL executed successfully, rows affected:', result.rowCount);
      return {
        rows: result.rows,
        rowsAffected: result.rowCount
      };
    } catch (error) {
      console.error('❌ SQL Execution Error:');
      console.error('   Error Message:', error.message);
      console.error('   SQL Query:', trimmedSql);
      console.error('   Parameters:', params);
      console.error('   Stack:', error.stack);
      throw error;
    }
  },
  
  query: async (sql, params = []) => {
    // Enhanced validation
    if (!sql) {
      console.error('❌ SQL query is null or undefined');
      throw new Error('SQL query cannot be null or undefined');
    }
    
    if (typeof sql !== 'string') {
      console.error('❌ SQL query must be a string, received:', typeof sql);
      throw new Error('SQL query must be a string');
    }
    
    const trimmedSql = sql.trim();
    if (trimmedSql === '') {
      console.error('❌ SQL query is empty after trimming');
      throw new Error('SQL query cannot be empty');
    }
    
    console.log('🔍 Querying SQL:', trimmedSql.substring(0, 100) + (trimmedSql.length > 100 ? '...' : ''));
    if (params && params.length > 0) {
      console.log('🔍 With params:', params);
    }
    
    try {
      const result = await db.query(trimmedSql, params);
      console.log('✅ Query executed successfully, rows returned:', result.rows.length);
      return result;
    } catch (error) {
      console.error('❌ SQL Query Error:');
      console.error('   Error Message:', error.message);
      console.error('   SQL Query:', trimmedSql);
      console.error('   Parameters:', params);
      throw error;
    }
  },
  
  // Helper method to test connection
  testConnection: async () => {
    try {
      const result = await db.query('SELECT NOW(), VERSION()');
      return {
        connected: true,
        timestamp: result.rows[0].now,
        version: result.rows[0].version
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
};

module.exports = { db: dbWrapper, initDb };