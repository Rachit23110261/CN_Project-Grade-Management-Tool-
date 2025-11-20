-- Grade Management System Database Schema
-- PostgreSQL version

-- Drop existing tables if they exist (for fresh migration)
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS course_students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS pending_registrations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'professor', 'admin')),
    temp_password VARCHAR(255),
    temp_password_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Pending Registrations table
CREATE TABLE pending_registrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'professor')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_pending_registrations_email ON pending_registrations(email);
CREATE INDEX idx_pending_registrations_status ON pending_registrations(status);

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    professor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Grading policy (percentages, should sum to 100)
    policy_midsem INTEGER DEFAULT 0,
    policy_endsem INTEGER DEFAULT 0,
    policy_quizzes INTEGER DEFAULT 0,
    policy_project INTEGER DEFAULT 0,
    policy_assignment INTEGER DEFAULT 0,
    policy_attendance INTEGER DEFAULT 0,
    policy_participation INTEGER DEFAULT 0,
    
    -- Max marks for each assessment
    max_marks_midsem INTEGER DEFAULT 100,
    max_marks_endsem INTEGER DEFAULT 100,
    max_marks_quiz1 INTEGER DEFAULT 100,
    max_marks_quiz2 INTEGER DEFAULT 100,
    max_marks_quiz3 INTEGER DEFAULT 100,
    max_marks_quiz4 INTEGER DEFAULT 100,
    max_marks_quiz5 INTEGER DEFAULT 100,
    max_marks_quiz6 INTEGER DEFAULT 100,
    max_marks_quiz7 INTEGER DEFAULT 100,
    max_marks_quiz8 INTEGER DEFAULT 100,
    max_marks_quiz9 INTEGER DEFAULT 100,
    max_marks_quiz10 INTEGER DEFAULT 100,
    max_marks_assignment1 INTEGER DEFAULT 100,
    max_marks_assignment2 INTEGER DEFAULT 100,
    max_marks_assignment3 INTEGER DEFAULT 100,
    max_marks_assignment4 INTEGER DEFAULT 100,
    max_marks_assignment5 INTEGER DEFAULT 100,
    max_marks_project INTEGER DEFAULT 100,
    max_marks_assignment INTEGER DEFAULT 100,
    max_marks_attendance INTEGER DEFAULT 100,
    max_marks_participation INTEGER DEFAULT 100,
    
    quiz_count INTEGER DEFAULT 0 CHECK (quiz_count >= 0 AND quiz_count <= 10),
    assignment_count INTEGER DEFAULT 0 CHECK (assignment_count >= 0 AND assignment_count <= 5),
    letter_grades_published BOOLEAN DEFAULT FALSE,
    grading_scheme VARCHAR(20) DEFAULT 'relative' CHECK (grading_scheme IN ('relative', 'absolute')),
    grading_scale JSONB DEFAULT '{
        "A+": {"min": 95, "max": 100},
        "A": {"min": 90, "max": 94.99},
        "A-": {"min": 85, "max": 89.99},
        "B+": {"min": 80, "max": 84.99},
        "B": {"min": 75, "max": 79.99},
        "B-": {"min": 70, "max": 74.99},
        "C+": {"min": 65, "max": 69.99},
        "C": {"min": 60, "max": 64.99},
        "C-": {"min": 55, "max": 59.99},
        "D": {"min": 50, "max": 54.99},
        "F": {"min": 0, "max": 49.99}
    }'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_professor ON courses(professor_id);
CREATE INDEX idx_courses_code ON courses(code);

-- Course-Student enrollment (many-to-many)
CREATE TABLE course_students (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, student_id)
);

CREATE INDEX idx_course_students_course ON course_students(course_id);
CREATE INDEX idx_course_students_student ON course_students(student_id);

-- Grades table
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Individual assessment marks
    marks_midsem NUMERIC(5,2) DEFAULT 0,
    marks_endsem NUMERIC(5,2) DEFAULT 0,
    marks_quizzes NUMERIC(5,2) DEFAULT 0,
    marks_quiz1 NUMERIC(5,2) DEFAULT 0,
    marks_quiz2 NUMERIC(5,2) DEFAULT 0,
    marks_quiz3 NUMERIC(5,2) DEFAULT 0,
    marks_quiz4 NUMERIC(5,2) DEFAULT 0,
    marks_quiz5 NUMERIC(5,2) DEFAULT 0,
    marks_quiz6 NUMERIC(5,2) DEFAULT 0,
    marks_quiz7 NUMERIC(5,2) DEFAULT 0,
    marks_quiz8 NUMERIC(5,2) DEFAULT 0,
    marks_quiz9 NUMERIC(5,2) DEFAULT 0,
    marks_quiz10 NUMERIC(5,2) DEFAULT 0,
    marks_assignment1 NUMERIC(5,2) DEFAULT 0,
    marks_assignment2 NUMERIC(5,2) DEFAULT 0,
    marks_assignment3 NUMERIC(5,2) DEFAULT 0,
    marks_assignment4 NUMERIC(5,2) DEFAULT 0,
    marks_assignment5 NUMERIC(5,2) DEFAULT 0,
    marks_project NUMERIC(5,2) DEFAULT 0,
    marks_assignment NUMERIC(5,2) DEFAULT 0,
    marks_attendance NUMERIC(5,2) DEFAULT 0,
    marks_participation NUMERIC(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(course_id, student_id)
);

CREATE INDEX idx_grades_course ON grades(course_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_course_student ON grades(course_id, student_id);

-- Challenges table
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    
    description TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name VARCHAR(255),
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    
    professor_response TEXT,
    professor_attachment_url TEXT,
    professor_attachment_name VARCHAR(255),
    responded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_student ON challenges(student_id);
CREATE INDEX idx_challenges_course ON challenges(course_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_created ON challenges(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for challenge count per student per course
CREATE OR REPLACE VIEW challenge_counts AS
SELECT 
    student_id,
    course_id,
    COUNT(*) as total_challenges
FROM challenges
GROUP BY student_id, course_id;

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (name, email, password, role) VALUES 
('System Administrator', 'admin@example.com', '$2b$10$zYjGXzHkJw1V/7zqY7X8VO8uGvJpqcWZrBr9.CKPUgDhzx3VEQ5Ny', 'admin');

-- Create a sample professor (password: prof123)  
INSERT INTO users (name, email, password, role) VALUES 
('Dr. John Smith', 'professor@example.com', '$2b$10$XKHlG5qT8Y2ZvN1qL9c7QexNdKQlmP8sRv3xK4HpY1zQwZxYvP.Lm', 'professor');

-- Create a sample student (password: student123)
INSERT INTO users (name, email, password, role) VALUES 
('Alice Johnson', 'student@example.com', '$2b$10$KQXlG5qT8Y2ZvN1qL9c7QexNdKQlmP8sRv3xK4HpY1zQwZxYvP.Lm', 'student');