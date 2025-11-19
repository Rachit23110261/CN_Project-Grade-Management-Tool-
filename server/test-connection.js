import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'grademanagement',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    connectionTimeoutMillis: 10000, // 10 second timeout
  };

  console.log("🔗 Testing PostgreSQL connection with config:");
  console.log({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password ? '***' : 'NOT SET'
  });

  const client = new Client(config);

  try {
    console.log("\n⏳ Connecting...");
    await client.connect();
    console.log("✅ Connection successful!");

    console.log("\n🔍 Testing query...");
    const result = await client.query('SELECT version()');
    console.log("PostgreSQL Version:", result.rows[0].version);

    console.log("\n📊 Testing database access...");
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`Found ${tablesResult.rows.length} tables in the database`);

    console.log("\n🎉 All tests passed!");

  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log("\n🔧 PostgreSQL server is not running or not accessible on this port");
    } else if (error.code === '3D000') {
      console.log("\n📦 Database does not exist. Run create-database.js first");
    } else if (error.code === '28P01') {
      console.log("\n🔑 Authentication failed - check username/password");
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.log("\n⏰ Connection timeout - PostgreSQL might be slow to respond");
    }
  } finally {
    await client.end();
  }
}

testConnection();