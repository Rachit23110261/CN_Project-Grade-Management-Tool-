# 🔐 Security Update Migration Guide

## Overview
This guide helps you migrate from v1.0 to v2.0 with enhanced security features.

---

## ⚠️ Breaking Changes

### 1. Password Requirements (IMPORTANT!)
**Old passwords may no longer work!**

**New Requirements:**
- Minimum 8 characters (was 6)
- Must include:
  - 1 uppercase letter
  - 1 lowercase letter  
  - 1 number
  - 1 special character

**Action Required:**
All users must reset their passwords after upgrade if they don't meet the new requirements.

### 2. JWT Secret Requirement
Server will **NOT START** if `JWT_SECRET` is:
- Missing
- Less than 32 characters
- A common weak value (e.g., "secret", "password")

**Action Required:**
Update your `.env` file with a strong JWT secret:

```bash
# Generate a strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env
JWT_SECRET=<paste-generated-secret-here>
```

### 3. Rate Limiting Active
API requests are now rate-limited:
- Login: 5 attempts per 15 minutes
- Password reset: 3 attempts per hour
- General API: 100 requests per 15 minutes

**Action Required:**
Update frontend error handling to show rate limit messages.

---

## 📋 Step-by-Step Migration

### Step 1: Backup Database
```bash
# Backup PostgreSQL database
pg_dump -U postgres grademanagement > backup_before_update.sql
```

### Step 2: Update Dependencies
```bash
cd server
npm install
```

**New packages installed:**
- `express-validator` - Input validation
- `express-rate-limit` - Rate limiting
- `validator` - String validation utilities

### Step 3: Update .env File
```bash
# Check your .env file has these required variables
JWT_SECRET=<minimum-32-characters-strong-secret>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grademanagement
DB_USER=postgres
DB_PASSWORD=your_password
```

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Test Server Startup
```bash
npm start
```

**Expected Output:**
```
✅ JWT_SECRET is strong (64 characters)
✅ Environment variables validated successfully
🚀 Server running on port 5000
✅ PostgreSQL Connected: localhost:5432
```

**If you see errors:**
```
❌ SERVER STARTUP FAILED
❌ JWT_SECRET is too short!
```
👉 Go back to Step 3 and fix your JWT_SECRET

### Step 5: Reset Admin Password (if needed)
If admin password doesn't meet new requirements:

```bash
cd server
node src/makeadmin.js
```

This will update admin password to: `admin123` (change immediately!)

### Step 6: Notify Users
Send email to all users about password requirements:

**Email Template:**
```
Subject: Important: Password Policy Update

Dear User,

We've enhanced our security measures. Please note:

1. Passwords now require:
   - Minimum 8 characters
   - 1 uppercase letter
   - 1 lowercase letter
   - 1 number
   - 1 special character

2. If your current password doesn't meet these requirements,
   use "Forgot Password" to reset.

3. We've added rate limiting to prevent abuse:
   - 5 login attempts per 15 minutes
   - 3 password reset requests per hour

Thank you for your cooperation!
```

---

## 🧪 Testing After Migration

### 1. Test Password Validation
```bash
# Try weak password (should fail)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iitgn.ac.in","password":"weak"}'
```

### 2. Test Rate Limiting
```bash
# Make 6 rapid requests (6th should be rate limited)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

Expected on 6th attempt:
```json
{
  "message": "Too many login attempts from this IP, please try again after 15 minutes.",
  "retryAfter": "15 minutes"
}
```

### 3. Test Input Validation
```bash
# Invalid email (should fail)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"test"}'
```

Expected:
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```

---

## 📱 Frontend Updates Required

### 1. Update Error Handling

**Before:**
```javascript
catch (error) {
  alert(error.response.data.message);
}
```

**After:**
```javascript
catch (error) {
  if (error.response.status === 400) {
    // Validation errors
    const errors = error.response.data.errors;
    errors.forEach(err => {
      showError(`${err.field}: ${err.message}`);
    });
  } else if (error.response.status === 429) {
    // Rate limit error
    const retryAfter = error.response.data.retryAfter;
    alert(`Too many attempts. Try again after ${retryAfter}`);
  } else {
    alert(error.response.data.message);
  }
}
```

### 2. Update Password Input Hints

Add password requirements hint in UI:

```jsx
<div className="text-sm text-gray-600 mt-2">
  Password must contain:
  <ul className="list-disc ml-5 mt-1">
    <li>At least 8 characters</li>
    <li>1 uppercase letter</li>
    <li>1 lowercase letter</li>
    <li>1 number</li>
    <li>1 special character</li>
  </ul>
</div>
```

### 3. Add Rate Limit Feedback

Show remaining attempts or retry time:

```jsx
{rateLimitError && (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
    <p>{rateLimitError.message}</p>
    <p className="text-sm">Retry after: {rateLimitError.retryAfter}</p>
  </div>
)}
```

---

## 🔍 Troubleshooting

### Problem: Server won't start
**Error:** `JWT_SECRET is too short!`

**Solution:**
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Update .env
JWT_SECRET=<paste-generated-secret>
```

---

### Problem: All users can't login
**Error:** `Password must contain...`

**Solution:**
This is expected! Passwords don't meet new requirements.

**Fix for each user:**
1. Click "Forgot Password"
2. Request temporary password (sent to email)
3. Login with temporary password
4. Set new strong password

**Bulk fix for admins:**
```javascript
// Create a script to reset all passwords
// File: server/src/reset-all-passwords.js
import User from './models/userModel.js';
import { generateRandomPassword } from './controllers/authController.js';

const users = await User.find();
for (const user of users) {
  const tempPassword = generateRandomPassword();
  user.tempPassword = tempPassword;
  user.tempPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();
  console.log(`${user.email}: ${tempPassword}`);
}
```

---

### Problem: Getting rate limited during testing
**Error:** `Too many requests...`

**Solution:**

**Option 1:** Wait for the rate limit window to expire

**Option 2:** Temporarily disable rate limiting in development:

```javascript
// server/src/app.js
// Comment out this line during testing:
// app.use("/api/", apiLimiter);
```

**Option 3:** Clear rate limit cache by restarting server

---

### Problem: Validation errors in production
**Error:** `Validation failed: ...`

**Solution:**
Check what validation is failing:
```javascript
errors.forEach(err => {
  console.log('Field:', err.field);
  console.log('Message:', err.message);
});
```

Common issues:
- Email not valid format
- Name contains invalid characters
- Marks outside valid range (0-1000)
- Policy percentages don't sum to 100%

---

## 📊 Monitoring After Migration

### Check These Metrics Daily

1. **Failed Login Attempts**
   - Monitor for unusual patterns
   - May indicate brute force attempts

2. **Rate Limit Hits**
   - Too many = legitimate users affected
   - Consider adjusting limits

3. **Validation Failures**
   - High rate = users don't understand requirements
   - Update UI/UX to help users

4. **Password Resets**
   - Spike expected after migration
   - Should normalize after 1-2 weeks

### Logs to Watch

```bash
# Watch for rate limit hits
grep "429" server.log

# Watch for validation failures  
grep "Validation failed" server.log

# Watch for auth failures
grep "Invalid credentials" server.log
```

---

## 🚀 Rollback Plan (If Needed)

If critical issues arise:

### 1. Stop Server
```bash
# Ctrl+C in terminal
```

### 2. Restore Database Backup
```bash
psql -U postgres grademanagement < backup_before_update.sql
```

### 3. Revert Code Changes
```bash
git revert <commit-hash>
# or
git checkout <previous-version-tag>
```

### 4. Reinstall Old Dependencies
```bash
npm install
```

### 5. Restart with Old Configuration
```bash
npm start
```

---

## ✅ Post-Migration Checklist

- [ ] Server starts successfully with no errors
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] All required env vars are set
- [ ] Rate limiting is active
- [ ] Password validation works
- [ ] Input validation works on all endpoints
- [ ] Admin can login
- [ ] Test user can reset password
- [ ] Frontend shows validation errors properly
- [ ] Frontend shows rate limit errors properly
- [ ] All users have been notified
- [ ] Database backup completed
- [ ] Monitoring is in place

---

## 📞 Support

If you encounter issues:

1. Check `SECURITY.md` for detailed documentation
2. Review server logs for specific errors
3. Test with curl commands to isolate frontend vs backend issues
4. Check `.env` file has all required variables
5. Verify JWT_SECRET is strong enough

**Common Commands:**
```bash
# Check server logs
npm start

# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iitgn.ac.in","password":"Admin@123"}'

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📚 Additional Resources

- `SECURITY.md` - Complete security documentation
- `.env.example` - Environment variable template
- Server logs - Real-time debugging
- PostgreSQL logs - Database issues

---

**Migration completed successfully! 🎉**

Your system now has enterprise-grade security features.
