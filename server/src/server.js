import app from "./app.js";

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Access on local network: http://10.7.45.10:${PORT}`);
  console.log(`💻 Access locally: http://localhost:${PORT}`);
});
