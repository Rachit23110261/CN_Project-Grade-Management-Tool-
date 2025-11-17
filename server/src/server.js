import app from "./app.js";
import { validateEnvironment } from "./config/validateEnv.js";

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

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Access on local network: http://10.7.45.10:${PORT}`);
  console.log(`💻 Access locally: http://localhost:${PORT}`);
});
