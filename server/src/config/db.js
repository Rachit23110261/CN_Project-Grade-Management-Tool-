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
  connectionTimeoutMillis: 2000,
});

// Test connection
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`✅ PostgreSQL Connected: ${client.host || 'localhost'}:${client.port || 5432}`);
    client.release();
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    process.exit(1);
  }
};

// Export both pool and connect function
export { pool };
export default connectDB;
