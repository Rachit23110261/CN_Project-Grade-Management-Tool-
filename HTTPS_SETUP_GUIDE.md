# 🔐 HTTPS Setup Guide

**Version:** 2.3  
**Date:** November 18, 2025

---

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Certificate Generation](#certificate-generation)
- [Configuration](#configuration)
- [Browser Setup](#browser-setup)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

---

## 🎯 Overview

This guide will help you enable HTTPS for your Grade Management System. We support both HTTP and HTTPS protocols with easy switching between them.

### Why HTTPS?
- ✅ **Encrypted communication** - Protects data in transit
- ✅ **Authentication** - Verifies server identity
- ✅ **Data integrity** - Prevents tampering
- ✅ **Browser features** - Required for modern web APIs
- ✅ **SEO benefits** - Better search rankings

### Development vs Production
- **Development:** Self-signed certificates (this guide)
- **Production:** CA-signed certificates (Let's Encrypt, etc.)

---

## 🚀 Quick Start

### Windows (PowerShell)
```powershell
# 1. Navigate to server directory
cd server

# 2. Generate SSL certificates
.\generate-ssl-cert.ps1

# 3. Enable HTTPS in .env
# Add this line to server/.env:
USE_HTTPS=true

# 4. Update client API URL
# Add this line to client/.env:
VITE_API_URL=https://localhost:5000/api

# 5. Restart server
npm run dev
```

### Linux/Mac (Bash)
```bash
# 1. Navigate to server directory
cd server

# 2. Make script executable
chmod +x generate-ssl-cert.sh

# 3. Generate SSL certificates
./generate-ssl-cert.sh

# 4. Enable HTTPS in .env
echo "USE_HTTPS=true" >> .env

# 5. Update client API URL
echo "VITE_API_URL=https://localhost:5000/api" >> ../client/.env

# 6. Restart server
npm run dev
```

---

## 📖 Detailed Setup

### Step 1: Install OpenSSL (if not installed)

#### Windows
**Option 1: Chocolatey**
```powershell
choco install openssl
```

**Option 2: Download Installer**
1. Visit: https://slproweb.com/products/Win32OpenSSL.html
2. Download "Win64 OpenSSL v3.x.x"
3. Run installer
4. Add to PATH: `C:\Program Files\OpenSSL-Win64\bin`

**Option 3: Use Git Bash**
Git for Windows includes OpenSSL

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install openssl

# CentOS/RHEL
sudo yum install openssl

# Arch
sudo pacman -S openssl
```

#### macOS
```bash
# Using Homebrew
brew install openssl
```

### Step 2: Generate SSL Certificates

#### Windows
```powershell
cd server
.\generate-ssl-cert.ps1
```

#### Linux/Mac
```bash
cd server
chmod +x generate-ssl-cert.sh
./generate-ssl-cert.sh
```

**What this does:**
- Creates `server/ssl/` directory
- Generates `ssl/cert.pem` (certificate)
- Generates `ssl/key.pem` (private key)
- Valid for 365 days
- Includes localhost and your network IP (10.7.45.10)

### Step 3: Configure Server

Create or update `server/.env`:

```bash
# Enable HTTPS
USE_HTTPS=true

# Optional: Custom certificate paths
# SSL_CERT_PATH=/path/to/custom/cert.pem
# SSL_KEY_PATH=/path/to/custom/key.pem

# Update frontend URL to https
FRONTEND_URL=https://localhost:5173
```

### Step 4: Configure Client

Create or update `client/.env`:

```bash
# Enable HTTPS for client dev server
VITE_USE_HTTPS=true

# API URL must match server protocol
VITE_API_URL=https://localhost:5000/api

# For network access (change IP to match your machine)
# VITE_API_URL=https://10.7.45.10:5000/api
```

**Note:** The client will now run on `https://localhost:5173` instead of `http://localhost:5173`

### Step 5: Restart Both Server and Client

**Terminal 1 (Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
```

---

## 🔐 Certificate Generation

### What Gets Generated

The script creates a **self-signed certificate** with:
- **Algorithm:** RSA 2048-bit
- **Validity:** 365 days
- **Subject:** CN=localhost
- **SANs (Subject Alternative Names):**
  - DNS: localhost
  - DNS: 127.0.0.1
  - DNS: 10.7.45.10
  - IP: 127.0.0.1
  - IP: 10.7.45.10

### Manual Generation (Advanced)

If you need custom settings:

```bash
cd server

# Create ssl directory
mkdir ssl

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Grade Management/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:yourdomain.com,IP:127.0.0.1"
```

### Certificate Details

```bash
# View certificate info
openssl x509 -in ssl/cert.pem -text -noout

# Check expiration date
openssl x509 -in ssl/cert.pem -noout -dates

# Verify certificate and key match
openssl x509 -noout -modulus -in ssl/cert.pem | openssl md5
openssl rsa -noout -modulus -in ssl/key.pem | openssl md5
```

---

## ⚙️ Configuration

### Server Configuration Options

**`server/.env`:**
```bash
# Enable/Disable HTTPS
USE_HTTPS=true          # Use HTTPS
# USE_HTTPS=false       # Use HTTP (default)

# Server Port
PORT=5000

# Custom SSL paths (optional)
SSL_CERT_PATH=/custom/path/to/cert.pem
SSL_KEY_PATH=/custom/path/to/key.pem
```

### Client Configuration Options

**`client/.env`:**
```bash
# Option 1: Explicit URL (recommended)
VITE_API_URL=https://localhost:5000/api

# Option 2: Auto-detect protocol (leave empty)
# VITE_API_URL=

# Option 3: Network IP
VITE_API_URL=https://10.7.45.10:5000/api
```

### Vite HTTPS Configuration (Automatic)

The client is already configured to use HTTPS when enabled via environment variable.

**`client/vite.config.js`** (already configured):
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    https: process.env.VITE_USE_HTTPS === 'true' ? {
      key: fs.readFileSync(path.resolve(__dirname, '../server/ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../server/ssl/cert.pem')),
    } : false,
  }
})
```

**How it works:**
- When `VITE_USE_HTTPS=true`, client runs on `https://localhost:5173`
- When `VITE_USE_HTTPS=false` (or not set), client runs on `http://localhost:5173`
- Uses the same SSL certificates from `server/ssl/` directory

---

## 🌐 Browser Setup

### Accepting Self-Signed Certificates

When you access `https://localhost:5000` for the first time, browsers will show a security warning. This is **expected and normal** for self-signed certificates.

#### Chrome/Edge
1. Click **"Advanced"**
2. Click **"Proceed to localhost (unsafe)"**
3. Certificate is now trusted for this session

#### Firefox
1. Click **"Advanced"**
2. Click **"Accept the Risk and Continue"**
3. Certificate is now trusted

#### Safari
1. Click **"Show Details"**
2. Click **"visit this website"**
3. Confirm in popup

### Adding Certificate to Trusted Store (Optional)

For a better experience, add the certificate to your OS trust store:

#### Windows
```powershell
# Import certificate to Trusted Root
certutil -addstore -user "Root" server\ssl\cert.pem

# View installed certificates
certutil -store -user Root
```

#### macOS
```bash
# Add to keychain
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain server/ssl/cert.pem
```

#### Linux (Chrome/Chromium)
```bash
# Copy certificate
sudo cp server/ssl/cert.pem /usr/local/share/ca-certificates/localhost.crt

# Update certificates
sudo update-ca-certificates
```

---

## 🔧 Troubleshooting

### Issue 1: "SSL Certificates Not Found"

**Error:**
```
⚠️  SSL CERTIFICATES NOT FOUND
HTTPS is enabled but SSL certificates are missing.
```

**Solution:**
```bash
cd server
.\generate-ssl-cert.ps1  # Windows
./generate-ssl-cert.sh   # Linux/Mac
```

---

### Issue 2: "ERR_SSL_PROTOCOL_ERROR"

**Possible Causes:**
1. Server not running with HTTPS
2. Wrong port number
3. Certificate/key file corrupted

**Solution:**
```bash
# Check server is running
curl -k https://localhost:5000/api/health

# Regenerate certificates
rm -rf server/ssl
.\generate-ssl-cert.ps1

# Verify .env has USE_HTTPS=true
```

---

### Issue 3: "NET::ERR_CERT_AUTHORITY_INVALID"

**This is normal!** Self-signed certificates aren't trusted by default.

**Options:**
1. **Accept the warning** (easiest for development)
2. **Add to trust store** (see [Browser Setup](#browser-setup))
3. **Use production certificate** (for production only)

---

### Issue 4: Client Can't Connect to HTTPS Server

**Check:**
1. Client `.env` has correct URL:
   ```bash
   VITE_API_URL=https://localhost:5000/api
   ```

2. Restart Vite after changing `.env`:
   ```bash
   cd client
   npm run dev
   ```

3. Clear browser cache and hard reload (Ctrl+Shift+R)

---

### Issue 5: "OpenSSL Not Found"

**Windows:**
- Install OpenSSL (see [Step 1](#step-1-install-openssl-if-not-installed))
- Or use Git Bash

**Linux/Mac:**
```bash
# Install OpenSSL
sudo apt-get install openssl   # Ubuntu/Debian
brew install openssl            # macOS
```

---

## 🚀 Production Deployment

**⚠️ DO NOT use self-signed certificates in production!**

### Option 1: Let's Encrypt (Free)

**Using Certbot:**
```bash
# Install Certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**Update `.env`:**
```bash
USE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Option 2: Reverse Proxy (Recommended)

Use Nginx or Apache as a reverse proxy:

**Nginx Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then keep your Node server on HTTP (USE_HTTPS=false).

### Option 3: Cloud Platform SSL

Most cloud platforms (Heroku, AWS, Azure, etc.) handle SSL automatically.

---

## 📊 Comparison: HTTP vs HTTPS

| Feature | HTTP | HTTPS |
|---------|------|-------|
| **Encryption** | ❌ None | ✅ TLS/SSL |
| **Authentication** | ❌ No | ✅ Yes |
| **Data Integrity** | ❌ Can be modified | ✅ Protected |
| **Browser Warning** | ⚠️ "Not Secure" | ✅ Padlock icon |
| **Modern APIs** | ❌ Limited | ✅ Full access |
| **SEO Ranking** | ⚠️ Lower | ✅ Higher |
| **Setup Complexity** | ✅ Easy | ⚠️ Moderate |

---

## 🔒 Security Best Practices

### Development
- ✅ Use self-signed certificates
- ✅ Add `ssl/` to `.gitignore`
- ✅ Regenerate certificates every 90-365 days
- ✅ Never commit certificates to Git

### Production
- ✅ Use CA-signed certificates (Let's Encrypt)
- ✅ Enable HSTS (HTTP Strict Transport Security)
- ✅ Use strong cipher suites
- ✅ Enable OCSP stapling
- ✅ Redirect HTTP → HTTPS
- ✅ Use certificate monitoring

---

## 📁 File Structure

```
project/
├── server/
│   ├── ssl/                    # SSL certificates (git-ignored)
│   │   ├── cert.pem           # Certificate
│   │   └── key.pem            # Private key
│   ├── generate-ssl-cert.ps1  # Windows certificate generator
│   ├── generate-ssl-cert.sh   # Linux/Mac certificate generator
│   ├── .env                   # Server config (USE_HTTPS=true)
│   └── src/
│       └── server.js          # HTTPS server configuration
├── client/
│   └── .env                   # Client config (VITE_API_URL)
└── .gitignore                 # Excludes ssl/ directory
```

---

## ✅ Checklist

### Initial Setup
- [ ] Install OpenSSL
- [ ] Run certificate generation script
- [ ] Verify `ssl/cert.pem` and `ssl/key.pem` exist
- [ ] Add `ssl/` to `.gitignore`
- [ ] Set `USE_HTTPS=true` in `server/.env`
- [ ] Set `VITE_API_URL` in `client/.env`
- [ ] Restart server and client

### Testing
- [ ] Server starts without errors
- [ ] Can access `https://localhost:5000`
- [ ] Accept browser security warning
- [ ] Client can connect to server
- [ ] Login works
- [ ] All API calls work

### Troubleshooting
- [ ] Check server console for errors
- [ ] Check browser console for errors
- [ ] Verify certificate paths in `.env`
- [ ] Test with `curl -k https://localhost:5000`
- [ ] Try regenerating certificates

---

## 🆘 Support

### Common Commands

```bash
# Check if server is running
curl -k https://localhost:5000

# Test specific endpoint
curl -k https://localhost:5000/api/health

# View certificate details
openssl x509 -in server/ssl/cert.pem -text -noout

# Check certificate expiration
openssl x509 -in server/ssl/cert.pem -noout -enddate

# Verify server is listening on port
netstat -ano | findstr :5000     # Windows
lsof -i :5000                    # Linux/Mac
```

### Getting Help

1. Check this documentation
2. Review error messages carefully
3. Check console logs (server and client)
4. Verify all configuration files
5. Try regenerating certificates

---

## 📚 Additional Resources

- [MDN: What is HTTPS?](https://developer.mozilla.org/en-US/docs/Glossary/https)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Node.js HTTPS Module](https://nodejs.org/api/https.html)

---

**Last Updated:** November 18, 2025  
**Version:** 2.3  
**Status:** ✅ Production Ready (with CA certificates)
