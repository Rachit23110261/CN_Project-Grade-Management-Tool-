// Setup PostgreSQL database and schema
import pg from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

async function setupDatabase() {
  console.log("========================================");
  console.log("PostgreSQL Database Setup");
  console.log("========================================\n");

  // First, connect to the default 'postgres' database to create our database
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres', // Connect to default database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log("Step 1: Connecting to PostgreSQL...");
    await adminClient.connect();
    console.log("✅ Connected to PostgreSQL\n");

    // Check if database exists
    console.log("Step 2: Checking if database 'grademanagement' exists...");
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'grademanagement'"
    );

    if (dbCheck.rows.length === 0) {
      console.log("Database doesn't exist. Creating...");
      await adminClient.query('CREATE DATABASE grademanagement');
      console.log("✅ Database 'grademanagement' created\n");
    } else {
      console.log("✅ Database 'grademanagement' already exists\n");
    }

    await adminClient.end();

  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
    await adminClient.end();
    process.exit(1);
  }

  // Now connect to the grademanagement database to run the schema
  const dbClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'grademanagement',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    console.log("Step 3: Connecting to 'grademanagement' database...");
    await dbClient.connect();
    console.log("✅ Connected\n");

    // Read and execute schema
    console.log("Step 4: Running schema migration...");
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the entire schema as one command
    try {
      await dbClient.query(schema);
      console.log("✅ Schema migration completed\n");
    } catch (error) {
      console.error("❌ Error running schema:", error.message);
      throw error;
    }

    // Verify tables were created
    console.log("Step 5: Verifying tables...");
    const tablesResult = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log("Tables created:");
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    await dbClient.end();

    console.log("\n========================================");
    console.log("✅ Database setup complete!");
    console.log("========================================\n");
    console.log("Next step: Run 'node src/makeadmin.js' to create admin user\n");

    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error running schema:", error.message);
    await dbClient.end();
    process.exit(1);
  }
}

setupDatabase();
