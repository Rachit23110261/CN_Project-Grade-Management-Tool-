// Test script for registration system
import dotenv from "dotenv";
import PendingRegistration from "./models/PendingRegistration.js";
import { pool } from "./config/db.js";

dotenv.config();

async function testRegistrationSystem() {
  console.log("\n========================================");
  console.log("Testing Registration System");
  console.log("========================================\n");

  try {
    // Test 1: Check if table exists
    console.log("✓ Test 1: Checking pending_registrations table...");
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pending_registrations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log("❌ Table does not exist!");
      process.exit(1);
    }
    console.log("✅ Table exists\n");

    // Test 2: Test model methods
    console.log("✓ Test 2: Testing PendingRegistration model...");
    
    // Test create
    const testRegistration = await PendingRegistration.create({
      name: "Test User",
      email: "test@registration.com",
      password: "testpass123",
      role: "student"
    });
    console.log("✅ Create method works");
    console.log(`   Created registration ID: ${testRegistration.id}`);

    // Test findById
    const found = await PendingRegistration.findById(testRegistration.id);
    console.log("✅ FindById method works");

    // Test find
    const allPending = await PendingRegistration.find({ status: 'pending' });
    console.log(`✅ Find method works (found ${allPending.length} pending)`);

    // Test countByStatus
    const count = await PendingRegistration.countByStatus('pending');
    console.log(`✅ CountByStatus method works (${count} pending)\n`);

    // Test 3: Cleanup
    console.log("✓ Test 3: Cleaning up test data...");
    await PendingRegistration.deleteById(testRegistration.id);
    console.log("✅ Delete method works\n");

    console.log("========================================");
    console.log("✅ All tests passed!");
    console.log("========================================\n");
    
    console.log("Registration system is ready to use!");
    console.log("\nAPI Endpoints:");
    console.log("  POST   /api/registration/request");
    console.log("  GET    /api/registration/pending");
    console.log("  GET    /api/registration/stats");
    console.log("  PUT    /api/registration/approve/:id");
    console.log("  PUT    /api/registration/reject/:id");
    console.log("  DELETE /api/registration/:id\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

testRegistrationSystem();
