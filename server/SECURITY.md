# Security Implementation Guide

## 🔒 Security Enhancements Implemented

This document outlines all security improvements made to the Grade Management System.

---

## 1. Input Validation & Sanitization ✅

### Implementation
- **Package**: `express-validator` + `validator`
- **Location**: `server/src/middleware/validationMiddleware.js`

### Features
- **Email validation**: Checks format, normalizes, and sanitizes
- **Name validation**: Allows only letters, spaces, dots, hyphens, apostrophes
- **Password strength**: Enforces strong password policy (see below)
- **Numeric ranges**: Validates marks (0-1000), attendance (0-100), policy percentages (0-100)
- **Policy validation**: Ensures grading policy percentages sum to 100%
- **XSS protection**: Escapes HTML entities in user inputs

### Applied To
- User registration (single & bulk)
- Login
- Password changes
- Course creation/updates
- Grade updates
- All ID parameters

---

## 2. Rate Limiting ✅

### Implementation
- **Package**: `express-rate-limit`
- **Location**: `server/src/middleware/rateLimiter.js`

### Rate Limits

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|--------|---------|
| **Login** | 5 attempts | 15 min | Prevent brute force attacks |
| **Password Reset** | 3 attempts | 1 hour | Prevent reset spam |
| **Registration** | 10 attempts | 1 hour | Prevent account spam |
| **Bulk Operations** | 5 operations | 1 hour | Prevent bulk abuse |
| **Grade Updates** | 30 updates | 5 min | Prevent update spam |
| **General API** | 100 requests | 15 min | Overall protection |

### Features
- Tracks by IP address
- Returns `RateLimit-*` headers
- Skips successful login attempts from count
- Custom error messages with retry-after time

---

## 3. Strong Password Policy ✅

### Requirements
- **Minimum length**: 8 characters
- **Must contain**:
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

### Implementation
Uses `validator.isStrongPassword()` with custom options.

### Example Valid Passwords
```
MyP@ssw0rd
Admin#2024
Secure!Pass123
```

### Example Invalid Passwords
```
password        ❌ No uppercase, numbers, or special chars
PASSWORD123     ❌ No lowercase or special chars
MyPassword      ❌ No numbers or special chars
MyPass1         ❌ Too short (< 8 chars), no special chars
```

---

## 4. JWT Secret Validation ✅

### Implementation
- **Location**: `server/src/config/validateEnv.js`
- **Validates at server startup** (before accepting connections)

### Validation Checks
1. **Exists**: `JWT_SECRET` must be defined in `.env`
2. **Length**: Minimum 32 characters
3. **Complexity**: Should contain both letters and numbers
4. **Not weak**: Rejects common weak secrets like:
   - "secret", "mysecret", "jwtsecret"
   - "password", "123456"
   - "your-secret-key", "change-me"

### Server Startup Behavior
```javascript
// If JWT_SECRET is missing or weak:
❌ SERVER STARTUP FAILED
❌ JWT_SECRET is too short! (16 characters)
Minimum length: 32 characters
For security, use a strong random secret.
Example: JWT_SECRET=a3f8b2c1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Server exits with code 1
```

### Generating a Strong Secret
Use the provided function:
```javascript
import { generateJWTSecret } from './config/validateEnv.js';
console.log(generateJWTSecret());
// Output: 128-character hex string
```

Or use command line:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 5. Sensitive Data Protection ✅

### Debug Statement Removal
Removed all debug `console.log()` statements that could expose:
- User passwords
- JWT tokens
- Internal system state
- Database queries
- Personal information

### Error Message Sanitization
Changed from:
```javascript
❌ res.status(500).json({ message: error.message });
```

To:
```javascript
✅ res.status(500).json({ message: "Failed to update grades" });
```

### Benefits
- Prevents information leakage
- Hides internal implementation details
- Protects against reconnaissance attacks

---

## 6. Environment Variable Validation ✅

### Required Variables
Server validates these at startup:
- `JWT_SECRET` - JWT signing key
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

### Startup Check
```javascript
✅ Environment variables validated successfully
✅ JWT_SECRET is strong (64 characters)
✅ PostgreSQL Connected: localhost:5432
🚀 Server running on port 5000
```

---

## 7. Request Size Limits ✅

### Body Parser Limits
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

Reduced from 100mb to 10mb to prevent:
- Memory exhaustion attacks
- Slow request processing
- Server crashes from large payloads

---

## Usage Examples

### Frontend Error Handling

#### Validation Errors
```javascript
try {
  await api.post('/api/auth/register', userData);
} catch (error) {
  if (error.response.status === 400) {
    // Validation failed
    const errors = error.response.data.errors;
    errors.forEach(err => {
      console.log(`${err.field}: ${err.message}`);
    });
  }
}
```

#### Rate Limit Errors
```javascript
try {
  await api.post('/api/auth/login', credentials);
} catch (error) {
  if (error.response.status === 429) {
    // Rate limited
    const retryAfter = error.response.data.retryAfter;
    alert(`Too many attempts. Try again after ${retryAfter}`);
  }
}
```

---

## Testing Security Features

### 1. Test Strong Password Policy
```bash
# Should fail - weak password
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"weak","name":"Test","role":"student"}'

# Should succeed - strong password
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"MyP@ssw0rd123","name":"Test","role":"student"}'
```

### 2. Test Rate Limiting
```bash
# Make 6 rapid login attempts (should get rate limited on 6th)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### 3. Test Input Validation
```bash
# Should fail - invalid email
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"test"}'

# Should fail - XSS attempt
curl -X POST http://localhost:5000/api/courses/create \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","code":"CS101"}'
```

### 4. Test JWT Secret Validation
```bash
# Remove or weaken JWT_SECRET in .env
JWT_SECRET=weak

# Try to start server
npm start
# Should fail with error message
```

---

## Security Checklist

### Before Deployment
- [ ] Generated strong JWT_SECRET (64+ characters)
- [ ] All required env vars are set
- [ ] Debug logs removed from production code
- [ ] Rate limiting is active
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled (in production)
- [ ] CORS properly configured
- [ ] Database authentication enabled
- [ ] Regular security audits scheduled

### Monitoring
- [ ] Log failed login attempts
- [ ] Monitor rate limit hits
- [ ] Track validation failures
- [ ] Review error logs regularly
- [ ] Check for unusual patterns

---

## Future Security Enhancements

### Recommended Additions
1. **2FA (Two-Factor Authentication)**
   - SMS or authenticator app codes
   - Required for admin accounts

2. **Session Management**
   - Implement refresh tokens
   - Token blacklisting for logout
   - Session expiration notifications

3. **Audit Logging**
   - Track all grade changes
   - Log admin actions
   - User activity monitoring

4. **CAPTCHA**
   - Add to login after failed attempts
   - Protect registration endpoint

5. **IP Whitelisting**
   - Restrict admin access by IP
   - Geo-blocking if needed

6. **Security Headers**
   - Helmet.js for HTTP security headers
   - CSP (Content Security Policy)
   - HSTS (HTTP Strict Transport Security)

7. **Database Security**
   - Regular backups
   - Encryption at rest
   - Prepared statements everywhere

---

## Support & Documentation

### Key Files
- Validation: `server/src/middleware/validationMiddleware.js`
- Rate Limiting: `server/src/middleware/rateLimiter.js`
- Env Validation: `server/src/config/validateEnv.js`
- Route Protection: `server/src/routes/*.js`

### References
- [Express Validator Docs](https://express-validator.github.io/docs/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Changelog

### v2.0 - Security Update (Current)
- ✅ Added input validation middleware
- ✅ Implemented rate limiting
- ✅ Enforced strong password policy
- ✅ Added JWT secret validation
- ✅ Removed debug statements
- ✅ Sanitized error messages
- ✅ Added request size limits
- ✅ Validated environment variables

### v1.0 - Initial Release
- Basic authentication
- Grade management
- Course management
