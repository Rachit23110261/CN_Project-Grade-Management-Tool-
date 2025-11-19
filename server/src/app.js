// server/src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import Course from "./models/Course.js";

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Development URLs - HTTP
      'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174',
      'http://localhost:80', 'http://localhost',
      'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:3000',
      // Docker container communication
      'http://frontend:80', 'http://gmt-frontend:80',
      // Local network IPs - HTTP
      'http://10.7.45.10:5173', 'http://10.7.45.10:5174',
      'http://10.7.4.228:5173', 'http://10.7.4.228:5174',
      'http://192.168.0.1:5173', 'http://192.168.0.1:5174',
      'http://192.168.56.1:5173', 'http://192.168.56.1:5174',
      // Development URLs - HTTPS
      'https://localhost:3000', 'https://localhost:5173', 'https://localhost:5174',
      'https://localhost:80', 'https://localhost',
      'https://127.0.0.1:5173', 'https://127.0.0.1:5174', 'https://127.0.0.1:3000',
      // Local network IPs - HTTPS
      'https://10.7.45.10:5173', 'https://10.7.45.10:5174',
      'https://10.7.4.228:5173', 'https://10.7.4.228:5174',
      'https://192.168.0.1:5173', 'https://192.168.0.1:5174',
      'https://192.168.56.1:5173', 'https://192.168.56.1:5174'
    ];
    
    // In development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      // Allow any localhost/127.0.0.1 or local network origins
      if (origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.includes('10.') || 
          origin.includes('192.168.') ||
          allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    } else {
      // In production, use strict origin checking
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    // Log rejected origins for debugging
    console.log(`🚫 CORS rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Custom-Header'],
  exposedHeaders: ['Content-Length', 'X-Custom-Header'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200 // Some legacy browsers (IE11) choke on 204
};

app.use(cors(corsOptions));

// Additional manual CORS headers for problematic origins
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Always set CORS headers for OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  // Set CORS headers for all requests
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  next();
});

// Enhanced CORS debugging middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const method = req.method;
  const path = req.path;
  
  console.log(`📡 ${method} ${path} - Origin: ${origin || 'none'}`);
  
  // Log preflight requests specifically
  if (method === 'OPTIONS') {
    console.log(`✈️  CORS Preflight from: ${origin}`);
    console.log(`🎯 Requested method: ${req.headers['access-control-request-method']}`);
    console.log(`📋 Requested headers: ${req.headers['access-control-request-headers']}`);
  }
  
  // Check if origin is in allowed list
  const allowedOrigins = [
    'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174',
    'http://localhost:80', 'http://localhost', 'http://127.0.0.1:5173',
    'http://127.0.0.1:5174', 'http://127.0.0.1:3000',
    'https://localhost:3000', 'https://localhost:5173', 'https://localhost:5174',
    'https://localhost:80', 'https://localhost', 'https://127.0.0.1:5173',
    'https://127.0.0.1:5174', 'https://127.0.0.1:3000',
    'https://10.7.4.228:5173', 'https://10.7.4.228:5174'
  ];
  
  if (origin && !allowedOrigins.includes(origin)) {
    console.log(`⚠️  Origin not in allowed list: ${origin}`);
  }
  
  next();
});

app.use(express.json({ limit: '10mb' })); // Reduced from 100mb for security
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Base route
app.get("/", (req, res) => {
  res.send("Grade Management System API is running...");
});

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Grade Management System API'
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes)
app.use("/api/courses", courseRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/registration", registrationRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
