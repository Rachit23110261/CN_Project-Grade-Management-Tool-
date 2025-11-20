# 🔐 HTTPS Setup Complete!

## ✅ Status: HTTPS Enabled

Your Grade Management Tool is now running with HTTPS enabled for both frontend and backend.

---

## 🌐 Access URLs

### Frontend (Client)

**HTTPS (Primary)**
- 🔒 **Localhost**: `https://localhost`
- 🔒 **HTTP**: `http://localhost` (redirects to HTTPS)

**Note**: Port 443 (default HTTPS) and Port 80 (HTTP) are mapped in Docker

### Backend (API Server)

**HTTPS (Primary)**
- 🔒 **Localhost**: `https://localhost:5000`
- 🔒 **API Base**: `https://localhost:5000/api`

---

## ⚠️ Important: Browser Security Warning

Since we're using **self-signed SSL certificates** (for development), your browser will show a security warning. This is **EXPECTED and SAFE** for development.

### How to Accept the Certificate:

1. **Chrome/Edge/Brave**:
   - Click "Advanced"
   - Click "Proceed to localhost (unsafe)"

2. **Firefox**:
   - Click "Advanced"
   - Click "Accept the Risk and Continue"

3. **Safari**:
   - Click "Show Details"
   - Click "visit this website"

**You need to accept the certificate for BOTH:**
- ✅ Frontend: `https://localhost`
- ✅ Backend: `https://localhost:5000`

---

## 📋 What Was Configured

### Backend (Server)
- ✅ SSL Certificates generated (`server/ssl/cert.pem`, `server/ssl/key.pem`)
- ✅ HTTPS enabled via `USE_HTTPS=true` environment variable
- ✅ Node.js HTTPS server listening on port 5000
- ✅ Self-signed certificate (RSA 2048-bit, valid 365 days)

### Frontend (Client)
- ✅ SSL Certificates copied to nginx (`client/ssl/`)
- ✅ Nginx configured for HTTPS on port 443
- ✅ HTTP to HTTPS redirect enabled
- ✅ API URL configured to use HTTPS backend
- ✅ Security headers added (HSTS, X-Frame-Options, etc.)

### Docker Services
- ✅ Backend: Port 5000 exposed (HTTPS)
- ✅ Frontend: Ports 80 (HTTP) and 443 (HTTPS) exposed
- ✅ All services connected via `gmt-network`

---

## 🧪 Test Your Setup

### 1. Test Backend API
```bash
# Health check (accept certificate first)
curl -k https://localhost:5000/health

# Or open in browser
https://localhost:5000/api
```

### 2. Test Frontend
```bash
# Open in browser (accept certificate)
https://localhost
```

### 3. Test HTTP → HTTPS Redirect
```bash
# This should redirect to HTTPS
http://localhost
```

---

## 📝 Login Credentials

Use these default accounts to test:

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`

### Professor Account
- Email: `professor@example.com`
- Password: `prof123`

### Student Account
- Email: `student@example.com`
- Password: `student123`

---

## 🔧 Configuration Files Modified

1. **docker-compose.yml**
   - Added `USE_HTTPS: "true"` to backend environment
   - Added port 443 mapping for frontend

2. **client/nginx.conf**
   - Added HTTPS server block on port 443
   - Added HTTP to HTTPS redirect on port 80
   - Configured SSL certificate paths

3. **client/Dockerfile**
   - Copy SSL certificates to nginx
   - Expose both ports 80 and 443

4. **client/.env**
   - Updated API URL to use HTTPS

---

## 🚀 How to Start/Stop Services

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### Rebuild Services (after code changes)
```bash
docker compose up -d --build
```

### View Logs
```bash
# All services
docker compose logs -f

# Backend only
docker logs gmt-backend -f

# Frontend only
docker logs gmt-frontend -f
```

---

## 🔐 SSL Certificate Details

**Location**: `server/ssl/`
- `cert.pem` - SSL Certificate
- `key.pem` - Private Key

**Properties**:
- Type: Self-signed (for development only)
- Algorithm: RSA 2048-bit
- Validity: 365 days
- Common Name: localhost

**Regenerate Certificates** (if needed):
```powershell
cd server
.\generate-ssl-cert.ps1
```

Then rebuild frontend:
```bash
Copy-Item server\ssl\*.pem client\ssl\
docker compose up -d --build frontend
```

---

## ⚙️ Environment Variables

### Backend (.env or docker-compose.yml)
```env
USE_HTTPS=true
PORT=5000
SSL_CERT_PATH=ssl/cert.pem  # Optional, defaults to ssl/cert.pem
SSL_KEY_PATH=ssl/key.pem     # Optional, defaults to ssl/key.pem
```

### Frontend (client/.env)
```env
VITE_USE_HTTPS=true
VITE_API_URL=https://localhost:5000/api
```

---

## 🌍 Network Access (Optional)

To access from other devices on your network:

1. Find your local IP address:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"}
   ```

2. Update `client/.env`:
   ```env
   VITE_API_URL=https://YOUR_IP:5000/api
   ```

3. Access from other devices:
   - Frontend: `https://YOUR_IP`
   - Backend: `https://YOUR_IP:5000`

**Note**: Devices will also need to accept the security certificate.

---

## 🛡️ Production Deployment

**⚠️ IMPORTANT**: Self-signed certificates are for development only!

For production, you MUST:

1. ✅ Get a certificate from a trusted CA:
   - Let's Encrypt (free)
   - DigiCert, Sectigo, etc. (paid)

2. ✅ Use proper domain names (not localhost/IPs)

3. ✅ Update certificate paths in configuration

4. ✅ Use strong JWT_SECRET and database passwords

5. ✅ Enable firewall rules

6. ✅ Use reverse proxy (nginx, Apache)

---

## 📚 Additional Resources

- **HTTPS Setup Guide**: `HTTPS_SETUP_GUIDE.md`
- **HTTPS Quick Start**: `HTTPS_QUICK_START.md`
- **Security Documentation**: `server/SECURITY.md`
- **Docker Documentation**: `DOCKER_README.md`

---

## ✅ Current Status

| Service | Status | URL |
|---------|--------|-----|
| 🗄️ Database | ✅ Running | Internal: `database:5432` |
| 🔧 Backend | ✅ Running (HTTPS) | `https://localhost:5000` |
| 🎨 Frontend | ✅ Running (HTTPS) | `https://localhost` |

---

## 🎉 You're All Set!

Your Grade Management Tool is now secured with HTTPS!

**Next Steps**:
1. Open `https://localhost` in your browser
2. Accept the security certificate warning
3. Log in with the credentials above
4. Start managing grades!

**Need Help?**
- Check logs: `docker compose logs -f`
- Restart services: `docker compose restart`
- Rebuild: `docker compose up -d --build`

---

*Generated: November 20, 2025*
*HTTPS Setup Complete* ✅
