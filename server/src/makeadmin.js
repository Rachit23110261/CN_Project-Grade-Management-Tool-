import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userModel.js";

dotenv.config({ path: "../.env" });

await mongoose.connect(process.env.MONGO_URI);

const admin = new User({
  name: "Super Admin",
  email: "admin@iitgn.ac.in",
  password: "admin123", // plain text, will be auto-hashed
  role: "admin",
});

await admin.save();
console.log("Admin user created successfully!");

mongoose.connection.close();
