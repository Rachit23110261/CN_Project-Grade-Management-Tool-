import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";
// Force reload - Grade distribution debug
import { validateEnvironment } from "./config/validateEnv.js";
import connectDB from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    // Validate environment variables before starting server
    try {
      validateEnvironment();
    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('SERVER STARTUP FAILED');
      console.error('='.repeat(60));
      console.error(error.message);
      console.error('='.repeat(60) + '\n');
      process.exit(1);
    }

    // Test database connection
    console.log('🔍 Testing database connection...');
    try {
      await connectDB();
    } catch (dbError) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ DATABASE CONNECTION FAILED');
      console.error('='.repeat(60));
      console.error('The server cannot start without a database connection.');
      console.error('');
      console.error('Quick fixes:');
      console.error('1. Check if PostgreSQL is running:');
      console.error('   Get-Service -Name "*postgresql*"');
      console.error('');
      console.error('2. Create the database if it doesn\'t exist:');
      console.error('   node create-database.js');
      console.error('');
      console.error('3. Test connection manually:');
      console.error('   node test-connection.js');
      console.error('');
      console.error('4. Check your .env file credentials');
      console.error('='.repeat(60) + '\n');
      process.exit(1);
    }

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces
const USE_HTTPS = process.env.USE_HTTPS === 'true';

// SSL Certificate paths
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, '..', 'ssl', 'cert.pem');
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, '..', 'ssl', 'key.pem');

if (USE_HTTPS) {
  // Check if SSL certificates exist
  if (!fs.existsSync(SSL_CERT_PATH) || !fs.existsSync(SSL_KEY_PATH)) {
    console.error('\n' + '='.repeat(60));
    console.error('⚠️  SSL CERTIFICATES NOT FOUND');
    console.error('='.repeat(60));
    console.error('HTTPS is enabled but SSL certificates are missing.');
    console.error('');
    console.error('Please generate SSL certificates by running:');
    console.error('  Windows (PowerShell): .\\generate-ssl-cert.ps1');
    console.error('  Linux/Mac (Bash):     ./generate-ssl-cert.sh');
    console.error('');
    console.error('Or disable HTTPS by setting USE_HTTPS=false in .env');
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }

  // Read SSL certificate files
  const sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH)
  };

  // Create HTTPS server
  const server = https.createServer(sslOptions, app);

  server.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 HTTPS Server Started Successfully');
    console.log('='.repeat(60));
    console.log(`🚀 Server running on port ${PORT} (HTTPS)`);
    console.log(`📡 Network access: https://10.7.4.228:${PORT}`);
    console.log(`📡 Alt network:    https://10.7.45.10:${PORT}`);
    console.log(`💻 Local access:   https://localhost:${PORT}`);
    console.log('');
    console.log('⚠️  Browser Security Warning:');
    console.log('   Self-signed certificate - click "Advanced" → "Proceed"');
    console.log('   Accept warning for BOTH frontend and backend URLs');
    console.log('='.repeat(60) + '\n');
  });
} else {
  // Create HTTP server (default)
  const server = http.createServer(app);

  server.listen(PORT, HOST, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🌐 HTTP Server Started');
    console.log('='.repeat(60));
    console.log(`🚀 Server running on port ${PORT} (HTTP)`);
    console.log(`📡 Local network:  http://10.7.45.10:${PORT}`);
    console.log(`💻 Local access:   http://localhost:${PORT}`);
    console.log('');
    console.log('💡 To enable HTTPS, set USE_HTTPS=true in .env');
    console.log('   and run: .\\generate-ssl-cert.ps1');
    console.log('='.repeat(60) + '\n');
  });
}

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ SERVER STARTUP ERROR');
    console.error('='.repeat(60));
    console.error(error.message);
    console.error('='.repeat(60) + '\n');
    process.exit(1);
  }
}

// Start the server
startServer();
