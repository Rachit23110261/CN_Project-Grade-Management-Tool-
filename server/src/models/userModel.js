import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "professor", "admin"],
    default: "student",
  },
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  tempPassword: { type: String, default: null }, // Temporary password (hashed)
  tempPasswordExpires: { type: Date, default: null }, // Expiration time for temp password
}, { timestamps: true });


// Hash password before saving
userSchema.pre("save", async function (next) {
  // Hash main password if modified
  if (this.isModified("password") && !this.isModified("tempPassword")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  
  // Hash temp password if modified
  if (this.isModified("tempPassword") && this.tempPassword) {
    this.tempPassword = await bcrypt.hash(this.tempPassword, 10);
  }
  
  next();
});

// Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) { 
  var x = await bcrypt.compare(enteredPassword, this.password);
  console.log (this.password,x)
  return x;
};

// Compare temporary password
userSchema.methods.matchTempPassword = async function (enteredPassword) {
  if (!this.tempPassword || !this.tempPasswordExpires) {
    return false;
  }
  
  // Check if temp password has expired (1 hour validity)
  if (new Date() > this.tempPasswordExpires) {
    return false;
  }
  
  return await bcrypt.compare(enteredPassword, this.tempPassword);
};

const User = mongoose.model("User", userSchema);
export default User;
