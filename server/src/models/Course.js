import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  policy: {
    midsem: { type: Number, default: 0 },
    endsem: { type: Number, default: 0 },
    quizzes: { type: Number, default: 0 },
    project: { type: Number, default: 0 },
    assignment: { type: Number, default: 0 },
    attendance: { type: Number, default: 0 },
    participation: { type: Number, default: 0 },
  },
  quizCount: { type: Number, default: 0, min: 0, max: 10 }, // Number of active quizzes
}, { timestamps: true });



const Course = mongoose.model("Course", courseSchema);
export default Course;
