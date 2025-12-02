import { pool } from "./config/db.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const createAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO UPDATE 
       SET password = $3, name = $1
       RETURNING id, name, email, role, created_at`,
      ["Super Admin", "admin@iitgn.ac.in", hashedPassword, "admin"]
    );

    console.log("✅ Admin user created/updated successfully!");
    console.log(result.rows[0]);
    console.log("\nLogin credentials:");
    console.log("Email: admin@iitgn.ac.in");
    console.log("Password: admin123");
    console.log("\n⚠️  Please change the password after first login!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
