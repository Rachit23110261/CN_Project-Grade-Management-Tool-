@echo off
echo ========================================
echo PostgreSQL Database Setup
echo ========================================
echo.

echo Step 1: Creating database 'grademanagement'...
echo Please enter your PostgreSQL password when prompted
echo.

REM Create database
psql -U postgres -c "CREATE DATABASE grademanagement;"

if %errorlevel% neq 0 (
    echo.
    echo Note: Database might already exist, continuing...
    echo.
)

echo.
echo Step 2: Running schema migration...
echo.

REM Run schema
psql -U postgres -d grademanagement -f src\db\schema.sql

if %errorlevel% neq 0 (
    echo.
    echo ❌ Schema migration failed!
    echo Please check if PostgreSQL is installed and running.
    pause
    exit /b 1
)

echo.
echo ✅ Database setup complete!
echo.
echo Next step: Run 'node src\makeadmin.js' to create admin user
echo.
pause
