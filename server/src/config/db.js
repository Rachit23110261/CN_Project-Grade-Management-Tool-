import pg from "pg";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

const { Pool } = pg;

// Parse DATABASE_URL if provided, otherwise use individual env vars
let poolConfig;

if (process.env.DATABASE_URL) {
  try {
    // Parse connection string manually to avoid issues
    const url = new URL(process.env.DATABASE_URL);
    poolConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: decodeURIComponent(url.password), // Decode URL-encoded password
    };
  } catch (error) {
    console.error("Error parsing DATABASE_URL:", error.message);
    console.log("Falling back to individual env vars...");
    poolConfig = {
      host: 'localhost',
      port: 5432,
      database: 'grademanagement',
      user: 'postgres',
      password: process.env.DB_PASSWORD,
    };
  }
} else {
  // Use individual environment variables
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'grademanagement',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
  };
}

// Ensure password is a string and not empty
poolConfig.password = String(poolConfig.password || '');

if (!poolConfig.password) {
  console.warn("⚠️  Warning: Database password is empty!");
}

// Create PostgreSQL connection pool
const pool = new Pool({
  ...poolConfig,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased to 10 seconds
  acquireTimeoutMillis: 60000, // Time to wait for connection from pool
  createTimeoutMillis: 30000, // Time to wait for new connection to be created
  destroyTimeoutMillis: 5000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});

// Test connection
const connectDB = async () => {
  try {
    console.log("🔗 Attempting to connect to PostgreSQL...");
    console.log("📍 Connection config:", {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      password: poolConfig.password ? '***' : 'NOT SET'
    });
    
    const client = await pool.connect();
    console.log(`✅ PostgreSQL Connected: ${client.database}@${client.host || 'localhost'}:${client.port || 5432}`);
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`🕐 Database time: ${result.rows[0].current_time}`);
    
    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    console.error("🔍 Error details:", {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname,
      port: error.port
    });
    
    // Don't exit immediately, give suggestions
    console.log("\n🔧 Troubleshooting suggestions:");
    console.log("1. Check if PostgreSQL service is running");
    console.log("2. Verify database 'grademanagement' exists");
    console.log("3. Check username/password in .env file");
    console.log("4. Ensure pg_hba.conf allows local connections");
    console.log("5. Try connecting with psql: psql -U postgres -d grademanagement\n");
    
    throw error; // Re-throw to let server decide whether to exit
  }
};

// Export both pool and connect function
export { pool };
export default connectDB;
