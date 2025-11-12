import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  marks: {
    midsem: { type: Number, default: 0 },
    endsem: { type: Number, default: 0 },
    quizzes: { type: Number, default: 0 }, // Keep for backward compatibility
    quiz1: { type: Number, default: 0 },
    quiz2: { type: Number, default: 0 },
    quiz3: { type: Number, default: 0 },
    quiz4: { type: Number, default: 0 },
    quiz5: { type: Number, default: 0 },
    quiz6: { type: Number, default: 0 },
    quiz7: { type: Number, default: 0 },
    quiz8: { type: Number, default: 0 },
    quiz9: { type: Number, default: 0 },
    quiz10: { type: Number, default: 0 },
    assignment1: { type: Number, default: 0 },
    assignment2: { type: Number, default: 0 },
    assignment3: { type: Number, default: 0 },
    assignment4: { type: Number, default: 0 },
    assignment5: { type: Number, default: 0 },
    project: { type: Number, default: 0 },
    assignment: { type: Number, default: 0 },
    attendance: { type: Number, default: 0 },
    participation: { type: Number, default: 0 },
  },
}, { timestamps: true });

const Grade = mongoose.model("Grade", gradeSchema);
export default Grade;
