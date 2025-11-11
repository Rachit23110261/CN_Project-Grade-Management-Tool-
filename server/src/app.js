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
import { errorHandler } from "./middleware/errorHandler.js";
import Course from "./models/Course.js";

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://10.7.45.10:5173', 
    'http://10.7.45.10:5174',
    'http://192.168.0.1:5173',
    'http://192.168.0.1:5174'
  ],
  credentials: true
}));

app.use(express.json()); // for parsing application/json

// Base route
app.get("/", (req, res) => {
  res.send("Grade Management System API is running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes)
app.use("/api/courses", courseRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/challenges", challengeRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
