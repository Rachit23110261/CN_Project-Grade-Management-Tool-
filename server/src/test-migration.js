// Quick test script to verify PostgreSQL migration
// Run with: node src/test-migration.js

import { pool } from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const tests = [];
let passed = 0;
let failed = 0;

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
  passed++;
}

function logError(message, error) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
  if (error) console.log(`  ${colors.red}${error.message}${colors.reset}`);
  failed++;
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    logSuccess("Database connection successful");
    client.release();
  } catch (error) {
    logError("Database connection failed", error);
    throw error;
  }
}

async function testTablesExist() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(row => row.table_name);
    const expectedTables = ['users', 'courses', 'course_students', 'grades', 'challenges'];
    
    expectedTables.forEach(table => {
      if (tables.includes(table)) {
        logSuccess(`Table '${table}' exists`);
      } else {
        logError(`Table '${table}' is missing`);
      }
    });
  } catch (error) {
    logError("Failed to check tables", error);
  }
}

async function testAdminUser() {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE role = 'admin' LIMIT 1"
    );
    
    if (result.rows.length > 0) {
      logSuccess(`Admin user found: ${result.rows[0].email}`);
      logInfo(`  Name: ${result.rows[0].name}`);
      logInfo(`  ID: ${result.rows[0].id}`);
    } else {
      logError("No admin user found - run 'node src/makeadmin.js'");
    }
  } catch (error) {
    logError("Failed to check admin user", error);
  }
}

async function testIndexes() {
  try {
    const result = await pool.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    if (result.rows.length > 0) {
      logSuccess(`${result.rows.length} indexes created`);
      logInfo("  Key indexes:");
      result.rows.slice(0, 5).forEach(row => {
        logInfo(`    - ${row.tablename}.${row.indexname}`);
      });
    } else {
      logError("No indexes found");
    }
  } catch (error) {
    logError("Failed to check indexes", error);
  }
}

async function testForeignKeys() {
  try {
    const result = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);
    
    if (result.rows.length > 0) {
      logSuccess(`${result.rows.length} foreign keys configured`);
      result.rows.forEach(row => {
        logInfo(`  ${row.table_name}.${row.column_name} → ${row.foreign_table_name}`);
      });
    } else {
      logError("No foreign keys found");
    }
  } catch (error) {
    logError("Failed to check foreign keys", error);
  }
}

async function testTriggers() {
  try {
    const result = await pool.query(`
      SELECT event_object_table, trigger_name
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
    `);
    
    if (result.rows.length > 0) {
      logSuccess(`${result.rows.length} triggers configured`);
      result.rows.forEach(row => {
        logInfo(`  ${row.event_object_table}: ${row.trigger_name}`);
      });
    } else {
      logError("No triggers found");
    }
  } catch (error) {
    logError("Failed to check triggers", error);
  }
}

async function testModelImports() {
  try {
    const User = (await import("./models/userModel.js")).default;
    const Course = (await import("./models/Course.js")).default;
    const Grade = (await import("./models/Grade.js")).default;
    const Challenge = (await import("./models/Challenge.js")).default;
    
    logSuccess("All models import successfully");
    
    // Test that models have required methods
    const userMethods = ['create', 'findOne', 'findById', 'find'];
    const courseMethods = ['create', 'find', 'findById', 'populate'];
    const gradeMethods = ['find', 'findOne', 'findById', 'findOneAndUpdate'];
    const challengeMethods = ['create', 'find', 'findById', 'countDocuments'];
    
    userMethods.forEach(method => {
      if (typeof User[method] === 'function') {
        logSuccess(`  User.${method}() exists`);
      } else {
        logError(`  User.${method}() is missing`);
      }
    });
    
    courseMethods.forEach(method => {
      if (typeof Course[method] === 'function') {
        logSuccess(`  Course.${method}() exists`);
      } else {
        logError(`  Course.${method}() is missing`);
      }
    });
    
  } catch (error) {
    logError("Failed to import models", error);
  }
}

async function runAllTests() {
  console.log("\n" + "=".repeat(60));
  console.log("PostgreSQL Migration Verification");
  console.log("=".repeat(60) + "\n");
  
  try {
    logInfo("Testing database connection...");
    await testDatabaseConnection();
    
    console.log("\n" + "-".repeat(60) + "\n");
    logInfo("Checking database schema...");
    await testTablesExist();
    
    console.log("\n" + "-".repeat(60) + "\n");
    logInfo("Checking admin user...");
    await testAdminUser();
    
    console.log("\n" + "-".repeat(60) + "\n");
    logInfo("Checking indexes...");
    await testIndexes();
    
    console.log("\n" + "-".repeat(60) + "\n");
    logInfo("Checking foreign keys...");
    await testForeignKeys();
    
    console.log("\n" + "-".repeat(60) + "\n");
    logInfo("Checking triggers...");
    await testTriggers();
    
    console.log("\n" + "-".repeat(60) + "\n");
    logInfo("Testing model imports...");
    await testModelImports();
    
  } catch (error) {
    console.error("\n" + colors.red + "Critical error:" + colors.reset, error.message);
  } finally {
    console.log("\n" + "=".repeat(60));
    console.log(`${colors.green}Passed: ${passed}${colors.reset} | ${colors.red}Failed: ${failed}${colors.reset}`);
    console.log("=".repeat(60) + "\n");
    
    if (failed > 0) {
      console.log(colors.yellow + "⚠️  Some tests failed. Check MIGRATION_GUIDE.md for help." + colors.reset);
    } else {
      console.log(colors.green + "✅ All tests passed! Migration successful." + colors.reset);
      console.log(colors.blue + "\nNext steps:" + colors.reset);
      console.log("  1. Update remaining controllers (see CONTROLLER_UPDATE_REFERENCE.js)");
      console.log("  2. Start server: npm start");
      console.log("  3. Test API endpoints");
    }
    
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runAllTests();
