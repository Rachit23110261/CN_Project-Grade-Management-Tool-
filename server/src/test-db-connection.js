// Simple database connection test
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log("Environment variables loaded:");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "SET (hidden)" : "NOT SET");
console.log("\n");

const { Pool } = pg;

// Use individual environment variables (most reliable)
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'grademanagement',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

console.log("Pool configuration:");
console.log("  Host:", poolConfig.host);
console.log("  Port:", poolConfig.port);
console.log("  Database:", poolConfig.database);
console.log("  User:", poolConfig.user);
console.log("  Password:", poolConfig.password ? "SET (hidden)" : "NOT SET");
console.log("  Password type:", typeof poolConfig.password);
console.log("  Password length:", poolConfig.password ? poolConfig.password.length : 0);
console.log("\n");

const pool = new Pool(poolConfig);

async function testConnection() {
  try {
    console.log("Attempting to connect to PostgreSQL...");
    const client = await pool.connect();
    console.log("✅ Connection successful!");
    
    const result = await client.query('SELECT version()');
    console.log("PostgreSQL version:", result.rows[0].version);
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
