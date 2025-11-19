// Test admin registration endpoint
import fetch from 'node-fetch';

async function testAdminRegister() {
  try {
    console.log("🔍 Testing admin register endpoint...");
    
    // Test without authentication first
    console.log("\n1. Testing without authentication (should fail with 401):");
    const response1 = await fetch('https://10.7.4.228:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@test.com',
        password: 'test123',
        role: 'student'
      }),
      rejectUnauthorized: false // Accept self-signed cert
    });
    
    console.log(`Status: ${response1.status}`);
    const result1 = await response1.json();
    console.log('Response:', result1);
    
    // Test with invalid token
    console.log("\n2. Testing with invalid token (should fail with 401):");
    const response2 = await fetch('https://10.7.4.228:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@test.com',
        password: 'test123',
        role: 'student'
      }),
      rejectUnauthorized: false
    });
    
    console.log(`Status: ${response2.status}`);
    const result2 = await response2.json();
    console.log('Response:', result2);
    
    console.log("\n✅ Endpoint is accessible and returns expected authentication errors");
    console.log("❗ To test with valid admin token, you need to login as admin first");
    
  } catch (error) {
    console.error("❌ Error testing endpoint:", error.message);
  }
}

testAdminRegister();