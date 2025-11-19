// Debug script to check server startup issues
console.log("🔧 Starting debug server check...");

try {
  // Check if environment is properly configured
  console.log("📋 Checking environment...");
  require('dotenv').config();
  console.log("✅ Environment loaded");
  
  // Check if database can connect
  console.log("🔗 Testing database connection...");
  const { pool } = require('./src/config/db.js');
  
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      console.error("❌ Database connection failed:", err.message);
    } else {
      console.log("✅ Database connected:", result.rows[0]);
    }
    
    // Try to start the actual server
    console.log("🚀 Starting main server...");
    require('./src/server.js');
  });
  
} catch (error) {
  console.error("❌ Server startup failed:", error.message);
  console.error("Stack trace:", error.stack);
}