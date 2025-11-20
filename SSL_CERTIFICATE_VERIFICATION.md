# 🔐 SSL Certificate Verification Guide

## Step-by-Step: Accept Self-Signed Certificate

### For Chrome / Edge / Brave

#### Frontend (https://localhost)

1. **Open the URL**: `https://localhost`
   
2. **You'll see**: "Your connection is not private" warning
   - Error: `NET::ERR_CERT_AUTHORITY_INVALID`

3. **Click**: "Advanced" button (at bottom of warning page)

4. **Click**: "Proceed to localhost (unsafe)" or "Continue to localhost (unsafe)"

5. **Done!** ✅ The page should now load

#### Backend (https://localhost:5000)

1. **Open in new tab**: `https://localhost:5000`

2. **Repeat steps 2-5** above

3. **Done!** ✅ You should see API response or backend page

---

### For Firefox

#### Frontend & Backend

1. **Open the URL**: `https://localhost` or `https://localhost:5000`

2. **You'll see**: "Warning: Potential Security Risk Ahead"

3. **Click**: "Advanced..." button

4. **Click**: "Accept the Risk and Continue"

5. **Done!** ✅ Certificate accepted

---

### For Safari (macOS)

1. **Open the URL**: `https://localhost`

2. **You'll see**: "This Connection Is Not Private"

3. **Click**: "Show Details"

4. **Click**: "visit this website"

5. **Click**: "Visit Website" again in the popup

6. **Done!** ✅ Certificate accepted

---

## 🔍 How to View Certificate Details

### Chrome / Edge / Brave

1. After accepting the certificate, look at the address bar
2. You'll see a "Not Secure" warning or lock icon with a line through it
3. **Click the icon** → Select "Certificate"
4. **View details**:
   - Issued to: localhost
   - Issued by: localhost (self-signed)
   - Valid from: (current date)
   - Valid until: (current date + 365 days)
   - Public key: RSA (2048 bits)

### Firefox

1. Click the **lock icon** (or warning icon) in address bar
2. Click **"Connection not secure"**
3. Click **"More Information"**
4. Click **"View Certificate"** button
5. **Certificate details** will open in a new tab

### Safari

1. Click the **lock icon** in address bar
2. Click **"Show Certificate"**
3. View certificate details

---

## ✅ What You Should See After Accepting

### Frontend (https://localhost)
- Login page of Grade Management Tool
- "Not Secure" or crossed-out lock icon (expected for self-signed cert)
- No browser errors in console (F12)

### Backend (https://localhost:5000)
- JSON response or API message
- Example: `{"message": "Grade Management System API"}`

---

## 🧪 Test Both URLs

You need to accept the certificate for BOTH URLs separately:

### 1. Test Frontend
```
Open: https://localhost
Accept certificate
Verify: Login page loads
```

### 2. Test Backend
```
Open: https://localhost:5000
Accept certificate
Verify: API response shows
```

### 3. Test API Call
```
Open: https://localhost:5000/api/auth/health
or
https://localhost:5000/health
```

---

## 🔧 Troubleshooting

### "This site can't be reached"
**Problem**: Docker containers not running

**Fix**:
```powershell
docker compose up -d
docker ps  # Verify all 3 containers are running
```

### Certificate Still Not Working
**Problem**: Old certificate cached

**Fix**:
1. Clear browser cache and cookies for localhost
2. Or try Incognito/Private browsing mode
3. Restart browser

### "ERR_SSL_PROTOCOL_ERROR"
**Problem**: Backend not running on HTTPS

**Fix**:
```powershell
docker logs gmt-backend
# Check for "HTTPS Server Started Successfully"
```

If not, rebuild:
```powershell
docker compose up -d --build backend
```

---

## 📱 Quick Checklist

Use this checklist to verify everything:

- [ ] Opened `https://localhost` in browser
- [ ] Clicked "Advanced" → "Proceed to localhost"
- [ ] Login page loaded successfully
- [ ] Opened `https://localhost:5000` in new tab
- [ ] Accepted certificate for backend
- [ ] API response visible
- [ ] Tested logging in (optional)
- [ ] No console errors (F12 → Console tab)

---

## 🎯 Expected Browser Warnings

**Normal and Expected**:
- ⚠️ "Not Secure" in address bar
- ⚠️ Crossed-out lock icon
- ⚠️ "Certificate Authority Invalid"
- ⚠️ "Self-Signed Certificate"

**These are SAFE for development!**

**Not Normal** (needs fixing):
- ❌ "This site can't be reached"
- ❌ "Connection refused"
- ❌ Blank page with no option to proceed
- ❌ Infinite loading

---

## 🔑 Why Self-Signed Certificate?

Self-signed certificates are perfect for **development** because:
- ✅ Free to generate
- ✅ Work locally
- ✅ Encrypt traffic
- ✅ Test HTTPS features

But for **production**, you need:
- 🔒 Certificate from trusted CA (Let's Encrypt, DigiCert, etc.)
- 🔒 Real domain name
- 🔒 Proper SSL verification

---

## 🎬 Video Walkthrough (Text Version)

### Opening Frontend:
1. Browser → Address bar → Type `https://localhost`
2. Press Enter
3. See "Not private" warning
4. Click "Advanced"
5. Click "Proceed to localhost (unsafe)"
6. 🎉 Login page appears!

### Opening Backend:
1. New tab → Type `https://localhost:5000`
2. Press Enter
3. Repeat steps 3-5
4. 🎉 API response appears!

### Testing Login:
1. On login page, enter:
   - Email: `admin@example.com`
   - Password: `admin123`
2. Click Login
3. 🎉 Dashboard loads!

---

## 💡 Pro Tips

1. **Bookmark the URLs** after accepting certificates for easy access

2. **Use Incognito/Private mode** for testing (certificates won't persist)

3. **Check Network Tab** (F12 → Network) to see HTTPS requests:
   - Should show `https://localhost:5000/api/...`
   - Status: 200 OK

4. **Export Certificate** (optional):
   ```powershell
   # Certificate is here:
   server/ssl/cert.pem
   ```

5. **Install Certificate System-Wide** (optional, for convenience):
   - Windows: Double-click `cert.pem` → Install Certificate
   - This will stop browser warnings (but only for your machine)

---

## 🆘 Need More Help?

**Check logs**:
```powershell
# All services
docker compose logs -f

# Just frontend
docker logs gmt-frontend -f

# Just backend
docker logs gmt-backend -f
```

**Restart everything**:
```powershell
docker compose restart
```

**Full rebuild**:
```powershell
docker compose down
docker compose up -d --build
```

---

## ✅ Success Indicators

You've successfully verified the certificate when:
- ✅ Frontend loads at `https://localhost`
- ✅ Backend responds at `https://localhost:5000`
- ✅ Lock icon (even if crossed out) appears
- ✅ You can log in and use the application
- ✅ Network requests show HTTPS URLs
- ✅ No console errors about mixed content

---

*Remember: Browser warnings for self-signed certificates are normal and expected in development!*

🎉 **Happy Development with HTTPS!**
