# 🔐 HTTPS Quick Start Guide

## ⚡ Enable HTTPS in 3 Steps

### Step 1: Generate SSL Certificates
```powershell
cd server
.\generate-ssl-cert.ps1
```

### Step 2: Enable HTTPS
Add to `server/.env`:
```bash
USE_HTTPS=true
```

Add to `client/.env`:
```bash
VITE_USE_HTTPS=true
VITE_API_URL=https://localhost:5000/api
```

### Step 3: Restart Server and Client
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

Now access:
- **Frontend:** `https://localhost:5173`
- **Backend:** `https://localhost:5000`

---

## 🌐 Access URLs

| Component | Protocol | URL |
|-----------|----------|-----|
| **Frontend (Client)** | HTTPS | `https://localhost:5173` |
| **Frontend (Network)** | HTTPS | `https://10.7.45.10:5173` |
| **Backend (Server)** | HTTPS | `https://localhost:5000` |
| **Backend (Network)** | HTTPS | `https://10.7.45.10:5000` |
| **Frontend (HTTP)** | HTTP | `http://localhost:5173` |
| **Backend (HTTP)** | HTTP | `http://localhost:5000` |

---

## 🔧 Toggle Between HTTP and HTTPS

### Both Client and Server on HTTPS
```bash
# server/.env
USE_HTTPS=true

# client/.env
VITE_USE_HTTPS=true
VITE_API_URL=https://localhost:5000/api
```

### Both Client and Server on HTTP
```bash
# server/.env
USE_HTTPS=false

# client/.env  
VITE_USE_HTTPS=false
VITE_API_URL=http://localhost:5000/api
```

### Mixed (Not Recommended)
You can run client on HTTP and server on HTTPS (or vice versa), but it's better to keep them consistent.

**Remember:** Restart both server and client after changes!

---

## ⚠️ Browser Security Warning

When accessing HTTPS URLs for the first time, you'll see security warnings:

### For Backend (https://localhost:5000)
1. You'll see: **"Your connection is not private"**
2. Click **"Advanced"** → **"Proceed to localhost"**

### For Frontend (https://localhost:5173)
1. You'll see the same warning again
2. Click **"Advanced"** → **"Proceed to localhost"**

This is **NORMAL** for self-signed certificates in development.

**Note:** You need to accept the warning for **both** URLs (frontend and backend) separately.

---

## 🐛 Quick Troubleshooting

### Issue: "SSL Certificates Not Found"
```bash
cd server
.\generate-ssl-cert.ps1
```

### Issue: Client Can't Connect
1. Check `client/.env` has both:
   ```bash
   VITE_USE_HTTPS=true
   VITE_API_URL=https://localhost:5000/api
   ```
2. Restart client: `npm run dev`
3. Accept security warnings for **both** frontend and backend
4. Hard refresh browser: `Ctrl+Shift+R`

### Issue: "OpenSSL Not Found"
- **Windows:** `choco install openssl`
- **Linux:** `sudo apt-get install openssl`
- **Mac:** `brew install openssl`

---

## 📁 What Gets Created

```
server/
├── ssl/
│   ├── cert.pem    ← Certificate (public)
│   └── key.pem     ← Private key (secret)
└── .env
    └── USE_HTTPS=true
```

---

## 🔒 Security Notes

✅ **Development:** Self-signed certificates (this setup)  
❌ **Production:** Need CA-signed certificates (Let's Encrypt)

**Never commit to Git:**
- `ssl/` directory
- `*.pem` files
- `.env` files with secrets

---

## 📚 Full Documentation

See `HTTPS_SETUP_GUIDE.md` for complete details.

---

**Ready to go! 🚀**
