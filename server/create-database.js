import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function createDatabase() {
  // First connect to postgres database to create our target database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log("🔗 Connecting to PostgreSQL as admin...");
    await adminClient.connect();
    console.log("✅ Connected to PostgreSQL");

    // Check if database exists
    const dbName = process.env.DB_NAME || 'grademanagement';
    console.log(`🔍 Checking if database '${dbName}' exists...`);
    
    const checkResult = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      console.log(`📦 Creating database '${dbName}'...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database '${dbName}' created successfully!`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log("🔧 PostgreSQL server is not running or not accessible");
      console.log("💡 Try: net start postgresql-x64-17 (or your PostgreSQL version)");
    } else if (error.code === '28P01') {
      console.log("🔑 Authentication failed - check username/password");
    }
  } finally {
    await adminClient.end();
  }
}

createDatabase();