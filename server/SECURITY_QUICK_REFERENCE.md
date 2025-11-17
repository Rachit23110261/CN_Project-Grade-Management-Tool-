# 🔐 Security Quick Reference Card

## Password Requirements
```
✅ Minimum: 8 characters
✅ Must have: UPPERCASE, lowercase, number, special char
❌ Bad: password, Password1, MyPassword
✅ Good: MyP@ssw0rd123, Admin#2024!
```

## Rate Limits
```
Login:          5 / 15 min
Password Reset: 3 / 1 hour  
Registration:  10 / 1 hour
Bulk Ops:       5 / 1 hour
Grade Updates: 30 / 5 min
General API:  100 / 15 min
```

## Environment Variables (Required)
```bash
JWT_SECRET=minimum_32_chars_letters_numbers
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grademanagement
DB_USER=postgres
DB_PASSWORD=your_password
```

## Generate Strong JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Validation Errors (HTTP 400)
```json
{
  "message": "Validation failed",
  "errors": [
    {"field": "email", "message": "Must be a valid email"},
    {"field": "password", "message": "Password must contain..."}
  ]
}
```

## Rate Limit Errors (HTTP 429)
```json
{
  "message": "Too many requests...",
  "retryAfter": "15 minutes"
}
```

## Testing Commands
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test@123"}'

# Test rate limit (6th should fail)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

## Server Won't Start?
```bash
# Check JWT_SECRET
cat .env | grep JWT_SECRET

# Should be 32+ chars with letters & numbers
# Generate new one:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Quick File Reference
```
Validation:     server/src/middleware/validationMiddleware.js
Rate Limiting:  server/src/middleware/rateLimiter.js
Env Validation: server/src/config/validateEnv.js
Full Docs:      server/SECURITY.md
Migration:      server/MIGRATION_SECURITY.md
```

## Frontend Error Handling
```javascript
catch (error) {
  if (error.response.status === 400) {
    // Validation error - show field-specific messages
    error.response.data.errors.forEach(err => {
      showError(`${err.field}: ${err.message}`);
    });
  } else if (error.response.status === 429) {
    // Rate limited
    alert(`Too many attempts. Retry after ${error.response.data.retryAfter}`);
  } else {
    // Generic error
    alert(error.response.data.message);
  }
}
```

## Common Issues & Fixes

### Issue: "JWT_SECRET is too short"
```bash
# Fix: Generate strong secret (64 chars)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Add to .env: JWT_SECRET=<generated-value>
```

### Issue: Users can't login after update
```
Reason: Passwords don't meet new requirements
Fix: Use "Forgot Password" to reset with strong password
```

### Issue: Getting rate limited during testing
```
Fix 1: Wait for rate limit window to expire
Fix 2: Restart server (clears rate limit cache)
Fix 3: Comment out apiLimiter in app.js (dev only!)
```

### Issue: Validation errors on valid data
```
Check: Email format, password strength, marks range (0-1000)
Check: Policy percentages sum to 100%
Check: Course code format (letters/numbers only)
```

## Security Checklist Before Deploy
```
✅ Strong JWT_SECRET (64+ chars)
✅ All env vars set correctly
✅ Debug logs removed
✅ HTTPS enabled
✅ CORS properly configured
✅ Rate limiting active
✅ Input validation on all endpoints
✅ Users notified about password requirements
✅ Database backup completed
✅ Error handling updated in frontend
```

## Emergency Rollback
```bash
# Stop server
Ctrl+C

# Restore database
psql -U postgres grademanagement < backup.sql

# Revert code
git revert HEAD
# or
git checkout previous-version

# Restart
npm install && npm start
```

---

**Print this card and keep it handy! 📋**
