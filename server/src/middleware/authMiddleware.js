import jwt from "jsonwebtoken";
import User, { enhanceUser } from "../models/userModel.js";

// Middleware: Protect routes (verify JWT)
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userRow = await User.findById(decoded.id);
      if (!userRow) {
        return res.status(401).json({ message: "User not found" });
      }

      // Enhance user with methods
      req.user = enhanceUser(userRow);
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
};

// ✅ Role-based middleware
export const adminOnly = (req, res, next) => {
  console.log("🔍 Admin-only middleware check:");
  console.log("- User exists:", !!req.user);
  console.log("- User role:", req.user ? req.user.role : 'undefined');
  console.log("- Is admin:", req.user && req.user.role === "admin");
  
  if (req.user && req.user.role === "admin") {
    console.log("✅ Admin access granted");
    next();
  } else {
    console.log("❌ Admin access denied");
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

export const professorOnly = (req, res, next) => {
  if (req.user && req.user.role === "professor") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Professors only" });
  }
};

export const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Students only" });
  }
};

// ✅ Utility middleware for mixed routes (check if user is admin)
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied: Admins only" });
  }
};

export const verifyToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRow = await User.findById(decoded.id);
    if (!userRow) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Enhance user with methods
    req.user = enhanceUser(userRow);
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export const isProfessor = professorOnly;
export const isStudent = studentOnly;