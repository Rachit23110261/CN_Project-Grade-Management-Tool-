# MongoDB to PostgreSQL Migration Guide

This guide explains how to complete the migration from MongoDB to PostgreSQL for the Grade Management System.

## Migration Status

### ✅ Completed
1. **Dependencies**: Replaced `mongoose` with `pg` in package.json
2. **Database Connection**: Updated `src/config/db.js` to use PostgreSQL Pool
3. **SQL Schema**: Created `src/db/schema.sql` with all tables and relationships
4. **Models Converted**:
   - `src/models/userModel.js` - User queries with bcrypt integration
   - `src/models/Course.js` - Course queries with policy/maxMarks handling
   - `src/models/Grade.js` - Grade queries with upsert support
   - `src/models/Challenge.js` - Challenge queries with JOIN-based population
5. **Auth Controller**: Updated `src/controllers/authController.js` to use SQL models

### 🔨 Remaining Work

The following controllers still need minor updates to work with SQL models:

1. **courseController.js** - Update `.populate()` calls and array operations
2. **gradeController.js** - Update `.populate()` and aggregation queries
3. **userController.js** - Update user queries
4. **challengeController.js** - Update challenge queries and counting
5. **middleware/authMiddleware.js** - Update `User.findById()` to use SQL

## Quick Setup Steps

### 1. Install PostgreSQL

**Windows:**
```powershell
# Download and install from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE grademanagement;

# Exit psql
\q
```

### 3. Run Schema Migration

```powershell
# Navigate to server directory
cd server

# Run the schema file
psql -U postgres -d grademanagement -f src/db/schema.sql
```

### 4. Update Environment Variables

Edit `server/.env`:

```env
# Replace MONGO_URI with DATABASE_URL
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/grademanagement

# Or use individual variables:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=grademanagement
# DB_USER=postgres
# DB_PASSWORD=your_password

# Keep other variables the same
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key_here
FRONTEND_URL=http://10.1.2.3:5173
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

### 5. Install Dependencies

```powershell
cd server
npm install
```

### 6. Create Admin User

Update `src/makeadmin.js` to use SQL:

```javascript
import { pool } from "./config/db.js";
import bcrypt from "bcrypt";

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE SET password = $4
       RETURNING id, name, email, role`,
      ["Admin User", "admin@iitgn.ac.in", hashedPassword, "admin"]
    );

    console.log("✅ Admin user created/updated:");
    console.log(result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
```

Then run:
```powershell
node src/makeadmin.js
```

## Controller Updates Needed

### courseController.js Updates

Replace MongoDB-specific operations:

```javascript
// OLD (MongoDB)
const courses = await Course.find().populate("professor", "name email");
const enrolledIds = user.enrolledCourses;
const enrolled = await Course.find({ _id: { $in: enrolledIds } });

// NEW (SQL)
const courses = await Course.find(); // Already includes professor
const enrolledIds = await User.getEnrolledCourses(req.user.id);
const enrolled = await Promise.all(enrolledIds.map(id => Course.findById(id)));
```

For `joinCourse`:
```javascript
// OLD
user.enrolledCourses.push(course._id);
course.students.push(user._id);
await user.save();
await course.save();

// NEW
await User.enrollCourse(user.id, course.id);
await Course.addStudent(course.id, user.id);
```

For `.populate()` calls:
```javascript
// OLD
const course = await Course.findById(id)
  .populate("professor", "name email")
  .populate("students", "name email");

// NEW
let course = await Course.findById(id);
course = await Course.populate(course, ['professor', 'students']);
```

### gradeController.js Updates

Replace MongoDB aggregations:

```javascript
// OLD
const grades = await Grade.find({ course: courseId }).populate("student", "name email");

// NEW
const grades = await Grade.find({ course: courseId }); // Already populated
```

### challengeController.js Updates

For professor challenges:

```javascript
// OLD
const challenges = await Challenge.find({ /* filters */ });

// NEW
// For professor's challenges (across all courses)
const challenges = await Challenge.findForProfessor(req.user.id);

// For counting
const count = await Challenge.countDocuments({ student: studentId, course: courseId });
```

### middleware/authMiddleware.js Updates

```javascript
import User, { enhanceUser } from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
  // ... token extraction code ...
  
  const userRow = await User.findById(decoded.id);
  if (!userRow) {
    return res.status(404).json({ message: "User not found" });
  }
  
  req.user = enhanceUser(userRow);
  next();
};
```

## Testing the Migration

### 1. Start the Server

```powershell
cd server
npm start
```

You should see:
```
✅ PostgreSQL Connected: localhost:5432
🚀 Server running on port 5000
```

### 2. Test Login

```powershell
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email": "admin@iitgn.ac.in", "password": "admin123"}'
```

### 3. Verify Database

```powershell
psql -U postgres -d grademanagement

-- Check tables
\dt

-- Check users
SELECT * FROM users;

-- Check if admin exists
SELECT id, name, email, role FROM users WHERE role = 'admin';
```

## Key Differences: MongoDB vs PostgreSQL

### Data Types
- `ObjectId` → `SERIAL` (auto-incrementing integer)
- `Date` → `TIMESTAMP`
- Nested objects → Separate columns with prefixes (e.g., `policy_midsem`)

### Relationships
- MongoDB uses references (`ref:`) → SQL uses foreign keys
- MongoDB `.populate()` → SQL `JOIN` queries (done in model layer)
- Many-to-many (courses-students) → Junction table `course_students`

### Queries
- `find()` → `SELECT` with `WHERE`
- `findOne()` → `SELECT ... LIMIT 1`
- `create()` → `INSERT ... RETURNING`
- `findByIdAndUpdate()` → `UPDATE ... WHERE id = $1 RETURNING`
- `countDocuments()` → `SELECT COUNT(*)`

### Array Fields
- MongoDB: `user.enrolledCourses = [id1, id2]`
- SQL: Separate `course_students` table with foreign keys

## Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: Run the schema.sql file
```powershell
psql -U postgres -d grademanagement -f src/db/schema.sql
```

### Issue: "password authentication failed"
**Solution**: Update DATABASE_URL with correct password

### Issue: "Cannot find module 'pg'"
**Solution**: 
```powershell
cd server
rm -rf node_modules package-lock.json
npm install
```

### Issue: Controller errors after model changes
**Solution**: Update controller to use new model API (see sections above)

## Performance Considerations

### Indexes Created
- Users: `email`, `role`
- Courses: `professor_id`, `code`
- Grades: `course_id`, `student_id`, `(course_id, student_id)`
- Challenges: `student_id`, `course_id`, `status`, `created_at`

### Connection Pooling
The `pg` Pool is configured with:
- Max connections: 20
- Idle timeout: 30s
- Connection timeout: 2s

## Rollback Plan

If you need to revert to MongoDB:

1. Restore `mongoose` in package.json
2. Restore old model files from git history
3. Restore old `config/db.js`
4. Restart MongoDB service
5. Update `.env` to use `MONGO_URI`

## Next Steps

1. Complete remaining controller updates (see sections above)
2. Test all API endpoints
3. Update README.md with PostgreSQL setup instructions
4. Add `.env.example` with `DATABASE_URL`
5. Consider adding migration scripts for data import from MongoDB (if needed)

## Data Migration (If you have existing MongoDB data)

Create `src/db/migrate-data.js`:

```javascript
import mongoose from 'mongoose';
import { pool } from '../config/db.js';
import bcrypt from 'bcrypt';

async function migrateData() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI_OLD);
  
  // Get old models
  const OldUser = mongoose.model('User', oldUserSchema);
  const users = await OldUser.find();
  
  // Insert into PostgreSQL
  for (const user of users) {
    await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [user.name, user.email, user.password, user.role]
    );
  }
  
  console.log('Migration complete!');
}
```

Run:
```powershell
node src/db/migrate-data.js
```

---

**For questions or issues, check the console logs and PostgreSQL logs:**
```powershell
# PostgreSQL logs (Windows)
C:\Program Files\PostgreSQL\15\data\log\

# View recent PostgreSQL activity
psql -U postgres -d grademanagement -c "SELECT * FROM pg_stat_activity;"
```
