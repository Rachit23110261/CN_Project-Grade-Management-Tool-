import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')
  const useHttps = env.VITE_USE_HTTPS === 'true'

  console.log('🔍 VITE_USE_HTTPS:', env.VITE_USE_HTTPS)
  console.log('🔐 Using HTTPS:', useHttps)

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: 5173,
      // HTTPS Configuration
      // Uses SSL certificates from server/ssl/ directory
      https: useHttps ? {
        key: fs.readFileSync(path.resolve(__dirname, '../server/ssl/key.pem')),
        cert: fs.readFileSync(path.resolve(__dirname, '../server/ssl/cert.pem')),
      } : false,
    }
  }
})
