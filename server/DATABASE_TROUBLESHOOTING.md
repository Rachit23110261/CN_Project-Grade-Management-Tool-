# PostgreSQL Connection Troubleshooting Guide

## Quick Diagnosis Steps

### 1. Test Database Connection
```bash
# Run this to test the connection
node test-connection.js
```

### 2. Create Database (if needed)
```bash
# Run this to create the database if it doesn't exist
node create-database.js
```

### 3. Check PostgreSQL Service Status
```powershell
Get-Service -Name "*postgresql*"
```

### 4. Start PostgreSQL Service (if stopped)
```powershell
# Start the PostgreSQL service
net start postgresql-x64-17
# Or try:
# net start postgresql-x64-18
```

## Common Issues and Solutions

### Issue 1: "Connection terminated due to connection timeout"
**Cause:** Database server not responding or slow connection
**Solutions:**
- Increase connection timeout (already done in db.js)
- Check if PostgreSQL service is running
- Verify database exists

### Issue 2: Database doesn't exist
**Cause:** The 'grademanagement' database hasn't been created
**Solution:**
```bash
node create-database.js
```

### Issue 3: Authentication failed (28P01)
**Cause:** Wrong username/password
**Solutions:**
- Check .env file credentials
- Try connecting with psql to verify credentials:
```bash
psql -U postgres -d postgres
```

### Issue 4: Connection refused (ECONNREFUSED)
**Cause:** PostgreSQL service not running
**Solutions:**
```powershell
# Check service status
Get-Service -Name "*postgresql*"

# Start service if stopped
net start postgresql-x64-17
```

### Issue 5: Wrong port
**Cause:** PostgreSQL running on different port
**Solution:**
```powershell
# Check which ports PostgreSQL is using
netstat -an | findstr :5432
netstat -an | findstr :5433
```

## Environment Configuration

Make sure your `.env` file has correct settings:

```properties
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grademanagement
DB_USER=postgres
DB_PASSWORD=rachit12
```

## Manual Database Setup (if needed)

If automated scripts fail, manually create the database:

1. Open Command Prompt as Administrator
2. Navigate to PostgreSQL bin directory:
   ```cmd
   cd "C:\Program Files\PostgreSQL\17\bin"
   ```
3. Connect to PostgreSQL:
   ```cmd
   psql -U postgres
   ```
4. Create database:
   ```sql
   CREATE DATABASE grademanagement;
   \q
   ```

## Testing Connection

After fixing the issue, test with:
```bash
# Test database connection
node test-connection.js

# Start the server
npm start
```

## Next Steps

1. First run: `node test-connection.js`
2. If database doesn't exist: `node create-database.js`
3. Then start server: `npm start`