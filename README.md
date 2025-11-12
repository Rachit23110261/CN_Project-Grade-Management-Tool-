# 🎓 Grade Management System

A full-stack web application for managing student grades, courses, and academic challenges built with the MERN stack.

## 📑 Table of Contents
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [UI Features](#-ui-features)
- [Grade Challenge System](#-grade-challenge-system)
- [Bulk User Registration](#-bulk-user-registration)
- [Email Configuration](#-email-configuration)
- [Security Considerations](#-security-considerations)
- [Troubleshooting](#-troubleshooting)
- [Key Features Summary](#-key-features-summary)

## ✨ Features

### 👨‍🎓 Student Features
- **Course Management**: View enrolled courses and join available courses
- **Grade Tracking**: View detailed grade breakdowns with visual analytics
- **Grade Challenges**: Submit multiple challenges per course (max 5 challenges)
  - Upload attachments up to 25MB (PDF, images)
  - Track challenge count and remaining submissions
  - View challenge status with color-coded indicators
- **Challenge Tracking**: Monitor challenge status and professor responses
  - Download professor's response attachments
  - View detailed challenge history
  - Real-time status updates (pending, reviewed, resolved)
- **Password Management**: Change password and recover forgotten passwords

### 👨‍🏫 Professor Features
- **Course Management**: Create and manage courses with custom grading policies
  - Define weightages for midterm, endterm, assignments, quizzes, attendance, participation
  - Specify number of quizzes for each course
- **Grade Assignment**: Assign and update student grades (midterm, endterm, assignments, quizzes)
  - Bulk grade entry interface
  - Individual student grade updates
  - Automatic weighted score calculation
- **Challenge Review**: View and respond to student grade challenges
  - Review student submissions with attachments
  - Respond with detailed feedback and optional attachments
  - Track challenge resolution status
- **Email Notifications**: Automatic notifications for new challenges and responses

### 👨‍💼 Admin Features
- **User Management**: Register new users (students, professors, admins)
  - Single user registration with email notifications
  - CSV bulk user registration (upload multiple users at once)
  - Automatic random password generation
  - Welcome emails with login credentials
- **Role-Based Access**: Manage different user roles and permissions
- **Student & Professor Lists**: View and manage all users in the system
- **Download Sample CSV**: Get template for bulk user registration

### 🔐 Authentication & Security
- JWT-based authentication with 7-day token expiration
- Bcrypt password hashing
- Protected routes with role-based access control
- Forgot password with email recovery
- Change password functionality

### 📧 Email Features
- **Welcome Emails**: Automatic emails sent to newly registered users with credentials
- **Password Reset**: Temporary password generation and email delivery
- **Challenge Notifications**: 
  - Professors notified when students submit challenges
  - Students notified when professors respond to challenges
- **Professional Templates**: HTML-formatted emails with branding
- **Development Mode**: Password logging to console when email service unavailable

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite 7.2.2** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS v4** - Utility-first CSS framework
- **Papa Parse** - CSV parsing for bulk user uploads

### Backend
- **Node.js v24.11.0 & Express 5** - Server framework
- **MongoDB 8.2 & Mongoose** - Database and ODM
- **JWT (jsonwebtoken)** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Large payload handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Rachit23110261/CN_Project-Grade-Management-Tool-.git
cd CN_Project-Grade-Management-Tool-
```

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
# Update EMAIL_USER and EMAIL_PASSWORD with your Gmail App Password
```

**Environment Variables (server/.env):**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/grademanagement
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key_here

# Frontend URL (for email links)
# IMPORTANT: Replace with your network IP address (not localhost)
# To find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
# Example: FRONTEND_URL=http://10.1.2.3:5173
FRONTEND_URL=http://10.1.2.3:5173

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

**⚠️ Important: Network IP Configuration**
- The `FRONTEND_URL` should use your **network IP address** (10.x.x.x), not localhost
- This ensures email links work for all users on the network
- To find your IP:
  - **Windows**: Run `ipconfig` in terminal, look for "IPv4 Address" under your active network
  - **Mac/Linux**: Run `ifconfig` or `ip addr`, look for your network interface IP
  - Example: If your IP is `10.1.2.3`, set `FRONTEND_URL=http://10.1.2.3:5173`

### 3. Frontend Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install
```

### 4. Database Setup

```bash
# Ensure MongoDB is running
# On Windows: MongoDB should be running as a service
# On Mac/Linux: 
mongod

# The database will be created automatically on first run
```

### 5. Create Admin User

```bash
# From the server directory
cd server
node src/makeadmin.js
```

Default admin credentials:
- **Email**: `admin@iitgn.ac.in`
- **Password**: `admin123`

⚠️ **Change the admin password immediately after first login!**

## 🎮 Running the Application

### Development Mode

**Terminal 1 - Backend Server:**
```bash
cd server
npm start
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend Dev Server:**
```bash
cd client
npm run dev
```
Client runs on: http://localhost:5173

### Access the Application

Open your browser and navigate to: **http://localhost:5173**

## 👥 User Roles & Default Credentials

### Admin
- Email: `admin@iitgn.ac.in`
- Password: `admin123`

### Creating Other Users
Use the admin panel to register:
- **Students** - Can view grades and submit challenges
- **Professors** - Can create courses, assign grades, respond to challenges
- **Additional Admins** - Full system access

## 📁 Project Structure

```
CN_Project-Grade-Management-Tool-/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── api/                # Axios configuration
│   │   ├── components/         # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/            # React Context (Auth)
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── AdminRegister.jsx
│   │   │   ├── StudentCourses.jsx
│   │   │   ├── StudentGrades.jsx
│   │   │   ├── StudentChallenges.jsx
│   │   │   ├── ChallengeGrade.jsx
│   │   │   ├── ChangePassword.jsx
│   │   │   ├── ProffessorCourses.jsx
│   │   │   ├── ProfessorChallenges.jsx
│   │   │   ├── GradeManagement.jsx
│   │   │   ├── StudentsList.jsx
│   │   │   └── ProffessorList.jsx
│   │   ├── App.jsx             # Main app component with routing
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Node.js application
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   │   ├── db.js           # MongoDB connection
│   │   │   └── env.js
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── courseController.js
│   │   │   ├── gradeController.js
│   │   │   ├── userController.js
│   │   │   └── challengeController.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── userModel.js
│   │   │   ├── Course.js
│   │   │   ├── Grade.js
│   │   │   └── Challenge.js
│   │   ├── routes/             # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── courseRoutes.js
│   │   │   ├── gradeRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── challengeRoutes.js
│   │   ├── services/           # Business logic
│   │   │   └── emailService.js
│   │   ├── app.js              # Express app setup
│   │   ├── server.js           # Server entry point
│   │   └── makeadmin.js        # Admin user creation script
│   ├── .env.example            # Environment variables template
│   └── package.json
│
└── README.md                    # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/change-password` - Change password (Authenticated)

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create course (Professor)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course (Professor)
- `DELETE /api/courses/:id` - Delete course (Professor)

### Grades
- `GET /api/grades/:courseId` - Get grades for a course
- `POST /api/grades/:courseId` - Create/Update grades (Professor)
- `PUT /api/grades/:gradeId` - Update specific grade (Professor)

### Challenges
- `POST /api/challenges` - Create grade challenge (Student, max 5 per course)
- `GET /api/challenges/student` - Get student's challenges
- `GET /api/challenges/professor` - Get professor's challenges
- `GET /api/challenges/course/:courseId` - Get course challenges
- `GET /api/challenges/count/:courseId` - Get challenge count for a course
- `PUT /api/challenges/:id/respond` - Respond to challenge (Professor)
- `GET /api/challenges/:id` - Get challenge details

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/students` - Get all students
- `GET /api/users/professors` - Get all professors
- `POST /api/users/bulk-register` - Bulk register users via CSV (Admin)

## 🎨 UI Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern Gradient UI** - Beautiful color gradients and animations
- **Loading States** - Visual feedback during data fetching
- **Error Handling** - User-friendly error messages
- **Empty States** - Helpful messages when no data is available
- **Status Badges** - Visual indicators for challenge status (pending, reviewed, resolved)
- **Progress Bars** - Grade visualization with percentage bars
- **Modal Dialogs** - Clean modals for forms and details
- **Search & Filter** - Find students, professors, and challenges easily
- **Light Gray Navigation** - Clean, modern navigation bar with light gray active states
- **Color-Coded Warnings** - Visual feedback with blue, yellow, and red indicators
- **Challenge Counter** - Real-time display of remaining challenges (e.g., "2/5 challenges used")
- **Disabled States** - Clear visual indication when limits are reached
- **File Upload** - Drag-and-drop support with size validation (up to 25MB)
- **CSV Bulk Upload** - Tab interface for single and bulk user registration
- **Download Attachments** - Light gray download buttons for challenge attachments
- **Large Textareas** - 12-row textareas for detailed challenge descriptions and responses

## � Grade Challenge System

### Student Capabilities
- **Multiple Challenges**: Students can submit up to 5 challenges per course
- **Per-Course Limit**: The 5-challenge limit applies to the entire course, not individual grades
- **Challenge Tracking**: Real-time counter showing used/remaining challenges
- **Visual Feedback**: Color-coded indicators:
  - 🟢 **Blue**: 3+ challenges remaining (normal state)
  - 🟡 **Yellow**: 1-2 challenges remaining (warning)
  - 🔴 **Red**: 0 challenges remaining (limit reached)
- **Attachment Support**: Upload supporting documents (PDF, JPG, PNG) up to 25MB
- **Challenge History**: View all past challenges and their resolution status
- **Status Tracking**: Monitor challenge progress (pending → reviewed → resolved)

### Professor Capabilities
- **Challenge Review**: View all challenges submitted by students
- **Detailed Responses**: Provide comprehensive feedback with 12-row textarea
- **Attachment Support**: Attach documents to responses (up to 25MB)
- **Email Notifications**: Automatic notifications when students submit challenges
- **Bulk View**: See all challenges across all courses in one place
- **Course Filtering**: Filter challenges by specific courses

### Challenge Workflow
1. **Student submits challenge**:
   - Writes detailed description
   - Optionally attaches supporting documents
   - System checks if under 5-challenge limit
   - Email notification sent to professor
   
2. **Professor reviews**:
   - Views challenge details and attachments
   - Downloads student's supporting documents
   - Provides written response
   - Optionally attaches documents
   - Updates challenge status
   
3. **Student receives response**:
   - Email notification with response
   - Can view professor's feedback
   - Can download professor's attachments
   - Can submit another challenge if needed (within limit)

### Technical Details
- **Backend Validation**: Server enforces 5-challenge limit per course
- **Base64 Encoding**: Files stored as base64 in MongoDB
- **Large Payload Support**: Express body parser configured for 100MB
- **Frontend Validation**: File size and type checked before upload
- **API Endpoint**: `GET /challenges/count/:courseId` provides challenge statistics

## 📊 Bulk User Registration

### CSV Upload Feature
- **Tab Interface**: Switch between single user and bulk CSV registration
- **CSV Format**: Simple format with name, email, and role columns
- **Sample CSV Download**: Built-in template download for easy formatting
- **Role Selection**: Choose role (student/professor) for all users in CSV
- **Automatic Passwords**: System generates secure random passwords
- **Welcome Emails**: Each user receives email with their credentials
- **Results Display**: Detailed summary showing successful and failed registrations
- **Error Handling**: Clear error messages for invalid entries

### CSV Format Example
```csv
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
Bob Johnson,bob@example.com
```

### Bulk Registration Process
1. Admin clicks "Bulk Upload CSV" tab
2. Downloads sample CSV template
3. Fills in user data (name, email)
4. Selects role (student/professor) for all users
5. Uploads CSV file
6. System processes each user:
   - Validates email format
   - Checks for duplicates
   - Generates random password
   - Creates user account
   - Sends welcome email
7. Displays results with success/failure counts

## �📧 Email Configuration

The system uses Gmail for sending emails. Two modes are supported:

### Development Mode
In development, temporary passwords are logged to the server console if email fails:

```
========================================
🔐 TEMPORARY PASSWORD GENERATED
========================================
Email: user@example.com
Temporary Password: abc123def456
========================================
```

### Production Mode
For production, configure a Gmail App Password:

1. Enable 2-Step Verification
2. Generate App Password
3. Update `server/.env`:
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
FRONTEND_URL=http://10.1.2.3:5173  # Use your network IP address
```

### Network IP Configuration for Email Links
**⚠️ IMPORTANT**: All emails contain login links. To ensure these links work for users across your network:

1. **Find your network IP address**:
   - Windows: Run `ipconfig` in command prompt
   - Mac/Linux: Run `ifconfig` or `ip addr`
   - Look for IPv4 address (e.g., 10.1.2.3 or 192.168.x.x)

2. **Set FRONTEND_URL in .env**:
   ```env
   FRONTEND_URL=http://10.1.2.3:5173
   ```
   Replace `10.1.2.3` with your actual network IP

3. **Why this matters**:
   - Email links use `localhost` by default (only works on server machine)
   - Network IP allows all users on the network to access the system
   - Emails include: Welcome emails, password resets, challenge notifications

4. **Update when IP changes**:
   - If your network IP changes, update the `.env` file
   - Restart the server for changes to take effect

### Alternative Email Services
You can also use:
- **Mailtrap** (for testing)
- **SendGrid** (for production)
- **AWS SES** (for production)
- **Mailgun** (for production)

Update `server/src/services/emailService.js` accordingly.

## 🔒 Security Considerations

### Password Security
- Passwords are hashed using bcrypt (10 salt rounds)
- JWT tokens expire after 7 days
- Temporary passwords are randomly generated (16 characters)

### Environment Variables
- Never commit `.env` files to Git
- Use `.env.example` as a template
- `.env` is already in `.gitignore`

### Production Checklist
- [ ] Change default admin password
- [ ] Update JWT_SECRET to a strong random value
- [ ] Use strong MongoDB credentials
- [ ] Enable HTTPS
- [ ] Set up proper CORS policies
- [ ] Implement rate limiting
- [ ] Add request validation and sanitization
- [ ] Use production email service
- [ ] Enable MongoDB authentication
- [ ] Set up proper logging
- [ ] Configure backup strategy

## 🐛 Troubleshooting

### Common Issues

##### Server won't start
```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# Kill the process if needed (Windows)
taskkill /PID <PID> /F
```

##### MongoDB connection error
```bash
# Check if MongoDB is running
# Windows: Check Services
# Mac/Linux:
ps aux | grep mongod

# Start MongoDB if not running
mongod
```

##### Email not sending
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check 2-Step Verification is enabled
- In development, check server console for logged passwords
- Ensure EMAIL_USER and EMAIL_PASSWORD are set in .env

##### Can't login
- Verify MongoDB is running
- Check if admin user exists by running makeadmin.js
- Try forgot password feature
- Check browser console for errors

##### Client build errors
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Challenge upload fails ("Entity too large")
- This is fixed in the latest version (100MB backend limit)
- If still occurring, check server/src/app.js for body parser limits
- Frontend validates 25MB, backend supports up to 100MB (accounting for base64 encoding)

#### Challenge counter not updating
- Refresh the page after submitting a challenge
- Check browser console for API errors
- Verify backend route `/challenges/count/:courseId` is working

#### CSV upload not working
- Ensure CSV format matches the template (name, email columns)
- Check for invalid email addresses
- Verify role is selected before uploading
- Check server console for detailed error messages

## 🎯 Key Features Summary

### ✅ Completed Features
1. **Multiple Grade Challenges** - Students can challenge grades up to 5 times per course
2. **Large File Attachments** - Support for up to 25MB attachments (100MB backend)
3. **CSV Bulk Registration** - Upload multiple users at once with automatic email notifications
4. **Welcome Email System** - New users receive credentials via email automatically
5. **Challenge Counter UI** - Real-time display of remaining challenges with color coding
6. **Improved Textareas** - 12-row textareas for detailed descriptions and responses
7. **Light Gray UI Elements** - Modern, clean navigation and button styling
8. **Download Attachments** - Both students and professors can download challenge attachments
9. **Email Notifications** - Comprehensive email system for all major actions
10. **Role-Based Access Control** - Secure authentication with JWT tokens


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of an academic assignment at IIT Gandhinagar.

## 👨‍💻 Authors

- **Rachit** - [GitHub Profile](https://github.com/Rachit23110261)
- **Kaushal** - [GitHub Profile](https://github.com/Kaushal845)

## 🙏 Acknowledgments

- IIT Gandhinagar Computer Networks Course
- MongoDB Documentation
- React Documentation
- Express.js Documentation
- Tailwind CSS Documentation

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact: IIT Gandhinagar

---

**Made with ❤️ for Computer Networks Course Project**
