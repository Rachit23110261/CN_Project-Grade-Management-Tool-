# 🎓 Grade Management System

A full-stack web application for managing student grades, courses, and academic challenges built with the MERN stack.

## ✨ Features

### 👨‍🎓 Student Features
- **Course Management**: View enrolled courses and join available courses
- **Grade Tracking**: View detailed grade breakdowns with visual analytics
- **Grade Challenges**: Submit challenges for grades with supporting documents
- **Challenge Tracking**: Monitor challenge status and professor responses
- **Password Management**: Change password and recover forgotten passwords

### 👨‍🏫 Professor Features
- **Course Management**: Create and manage courses
- **Grade Assignment**: Assign and update student grades (midterm, endterm, assignments)
- **Challenge Review**: View and respond to student grade challenges
- **Email Notifications**: Automatic notifications for new challenges

### 👨‍💼 Admin Features
- **User Management**: Register new users (students, professors, admins)
- **Role-Based Access**: Manage different user roles and permissions
- **Student & Professor Lists**: View and manage all users in the system

### 🔐 Authentication & Security
- JWT-based authentication with 7-day token expiration
- Bcrypt password hashing
- Protected routes with role-based access control
- Forgot password with email recovery
- Change password functionality

### 📧 Email Features
- Password reset via temporary password
- Challenge submission notifications (to professors)
- Challenge response notifications (to students)
- Configurable email service (Gmail with App Passwords)

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS v4** - Utility-first CSS framework

### Backend
- **Node.js & Express 5** - Server framework
- **MongoDB & Mongoose 8** - Database and ODM
- **JWT (jsonwebtoken)** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **CORS** - Cross-origin resource sharing

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

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

**Getting Gmail App Password:**
1. Enable 2-Step Verification in your Google Account
2. Go to Security > App Passwords
3. Generate password for "Mail" app
4. Copy the 16-character password (remove spaces)

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
- `POST /api/challenges` - Create grade challenge (Student)
- `GET /api/challenges/student` - Get student's challenges
- `GET /api/challenges/professor` - Get professor's challenges
- `GET /api/challenges/course/:courseId` - Get course challenges
- `PUT /api/challenges/:id/respond` - Respond to challenge (Professor)
- `GET /api/challenges/:id` - Get challenge details

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/students` - Get all students
- `GET /api/users/professors` - Get all professors

## 🎨 UI Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern Gradient UI** - Beautiful color gradients and animations
- **Loading States** - Visual feedback during data fetching
- **Error Handling** - User-friendly error messages
- **Empty States** - Helpful messages when no data is available
- **Status Badges** - Visual indicators for challenge status
- **Progress Bars** - Grade visualization with percentage bars
- **Modal Dialogs** - Clean modals for forms and details
- **Search & Filter** - Find students, professors, and challenges easily

## 📧 Email Configuration

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
```

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

### Server won't start
```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# Kill the process if needed (Windows)
taskkill /PID <PID> /F
```

### MongoDB connection error
```bash
# Check if MongoDB is running
# Windows: Check Services
# Mac/Linux:
ps aux | grep mongod

# Start MongoDB if not running
mongod
```

### Email not sending
- Verify Gmail App Password is correct (16 characters, no spaces)
- Check 2-Step Verification is enabled
- In development, check server console for logged passwords

### Can't login
- Verify MongoDB is running
- Check if admin user exists:
```bash
cd server
node check-user.js
```
- Try forgot password feature

### Client build errors
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

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
