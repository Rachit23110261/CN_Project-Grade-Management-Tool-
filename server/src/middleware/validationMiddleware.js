import { body, param, validationResult } from 'express-validator';
import validator from 'validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Strong password validation
const passwordPolicy = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1
};

// Custom password validator
const isStrongPassword = (value) => {
  return validator.isStrongPassword(value, passwordPolicy);
};

// User Registration/Creation Validation
export const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name can only contain letters, spaces, dots, hyphens and apostrophes')
    .customSanitizer(value => validator.escape(value)),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email is too long'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .custom(isStrongPassword).withMessage(
      'Password must contain at least: 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
    ),
  
  body('role')
    .optional()
    .isIn(['student', 'professor', 'admin']).withMessage('Invalid role'),
  
  validate
];

// Login Validation
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

// Password Change Validation
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .custom(isStrongPassword).withMessage(
      'Password must contain at least: 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character'
    ),
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
  
  validate
];

// Email Validation (for forgot password)
export const validateEmail = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  validate
];

// Course Creation/Update Validation
export const validateCourse = [
  body('name')
    .trim()
    .notEmpty().withMessage('Course name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Course name must be between 2 and 200 characters')
    .customSanitizer(value => validator.escape(value)),
  
  body('code')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .isLength({ min: 2, max: 20 }).withMessage('Course code must be between 2 and 20 characters')
    .matches(/^[A-Z0-9-]+$/i).withMessage('Course code can only contain letters, numbers, and hyphens')
    .customSanitizer(value => validator.escape(value)),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description is too long')
    .customSanitizer(value => validator.escape(value)),
  
  body('policy')
    .optional()
    .isObject().withMessage('Policy must be an object')
    .custom((value) => {
      if (!value) return true;
      
      // Validate that all values are numbers between 0 and 100
      const values = Object.values(value);
      if (!values.every(v => typeof v === 'number' && v >= 0 && v <= 100)) {
        throw new Error('All policy percentages must be between 0 and 100');
      }
      
      // Validate that percentages sum to 100 (with small tolerance for floating point)
      const sum = values.reduce((acc, val) => acc + val, 0);
      if (Math.abs(sum - 100) > 0.01) {
        throw new Error('Policy percentages must sum to 100%');
      }
      
      return true;
    }),
  
  body('quizCount')
    .optional()
    .isInt({ min: 0, max: 20 }).withMessage('Quiz count must be between 0 and 20'),
  
  body('assignmentCount')
    .optional()
    .isInt({ min: 0, max: 20 }).withMessage('Assignment count must be between 0 and 20'),
  
  validate
];

// Grade Update Validation
export const validateGrades = [
  body('grades')
    .isObject().withMessage('Grades must be an object'),
  
  body('grades.*')
    .isObject().withMessage('Each grade entry must be an object')
    .custom((value) => {
      // Validate that all marks are numbers and non-negative
      // Note: The actual max validation happens in the controller based on course maxMarks
      for (const [component, mark] of Object.entries(value)) {
        if (mark !== null && mark !== undefined) {
          if (typeof mark !== 'number' || mark < 0 || mark > 1000) {
            throw new Error(`Invalid mark for ${component}: must be a non-negative number not exceeding 1000`);
          }
        }
      }
      return true;
    }),
  
  // Validate that all marks are numbers between 0 and 1000 (hard limit)
  body('grades.*.midsem')
    .optional()
    .isFloat({ min: 0, max: 1000 }).withMessage('Midsem marks must be between 0 and 1000'),
  
  body('grades.*.endsem')
    .optional()
    .isFloat({ min: 0, max: 1000 }).withMessage('Endsem marks must be between 0 and 1000'),
  
  body('grades.*.quiz*')
    .optional()
    .isFloat({ min: 0, max: 1000 }).withMessage('Quiz marks must be between 0 and 1000'),
  
  body('grades.*.assignment*')
    .optional()
    .isFloat({ min: 0, max: 1000 }).withMessage('Assignment marks must be between 0 and 1000'),
  
  body('grades.*.project')
    .optional()
    .isFloat({ min: 0, max: 1000 }).withMessage('Project marks must be between 0 and 1000'),
  
  body('grades.*.attendance')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Attendance must be between 0 and 100'),
  
  body('grades.*.participation')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Participation must be between 0 and 100'),
  
  validate
];

// Max Marks Validation
export const validateMaxMarks = [
  body('maxMarks')
    .isObject().withMessage('Max marks must be an object')
    .custom((value) => {
      if (!value) return true;
      
      // Validate that all values are positive numbers
      const values = Object.values(value);
      if (!values.every(v => typeof v === 'number' && v > 0 && v <= 1000)) {
        throw new Error('All max marks must be positive numbers between 1 and 1000');
      }
      
      return true;
    }),
  
  body('maxMarks.*')
    .isFloat({ min: 1, max: 1000 }).withMessage('Max marks must be between 1 and 1000'),
  
  validate
];

// Bulk User Registration Validation
export const validateBulkRegistration = [
  body('users')
    .isArray({ min: 1 }).withMessage('Users must be a non-empty array'),
  
  body('users.*.name')
    .trim()
    .notEmpty().withMessage('Name is required for all users')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('users.*.email')
    .trim()
    .notEmpty().withMessage('Email is required for all users')
    .isEmail().withMessage('All emails must be valid')
    .normalizeEmail(),
  
  body('role')
    .isIn(['student', 'professor']).withMessage('Role must be student or professor'),
  
  validate
];

// MongoDB/PostgreSQL ID Validation
export const validateId = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isString().withMessage('ID must be a string')
    .isLength({ min: 1, max: 100 }).withMessage('Invalid ID format'),
  
  validate
];

// Course ID Validation
export const validateCourseId = [
  param('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isString().withMessage('Course ID must be a string'),
  
  validate
];

// Student ID Validation
export const validateStudentId = [
  param('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isString().withMessage('Student ID must be a string'),
  
  validate
];

// Quiz/Assignment Count Validation
export const validateQuizCount = [
  body('quizCount')
    .notEmpty().withMessage('Quiz count is required')
    .isInt({ min: 0, max: 20 }).withMessage('Quiz count must be between 0 and 20'),
  
  validate
];

export const validateAssignmentCount = [
  body('assignmentCount')
    .notEmpty().withMessage('Assignment count is required')
    .isInt({ min: 0, max: 20 }).withMessage('Assignment count must be between 0 and 20'),
  
  validate
];

// Grading Scale Validation
export const validateGradingScale = [
  body('gradingScale')
    .isObject().withMessage('Grading scale must be an object'),
  
  body('gradingScale.A+')
    .optional()
    .isFloat().withMessage('A+ threshold must be a number'),
  
  body('gradingScale.A')
    .optional()
    .isFloat().withMessage('A threshold must be a number'),
  
  body('gradingScale.B')
    .optional()
    .isFloat().withMessage('B threshold must be a number'),
  
  body('gradingScale.C')
    .optional()
    .isFloat().withMessage('C threshold must be a number'),
  
  body('gradingScale.D')
    .optional()
    .isFloat().withMessage('D threshold must be a number'),
  
  validate
];
