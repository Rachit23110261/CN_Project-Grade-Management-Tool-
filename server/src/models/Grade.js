import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  marks: {
    midsem: { type: Number, default: 0 },
    endsem: { type: Number, default: 0 },
    quizzes: { type: Number, default: 0 },
    project: { type: Number, default: 0 },
    assignment: { type: Number, default: 0 },
    attendance: { type: Number, default: 0 },
    participation: { type: Number, default: 0 },
  },
}, { timestamps: true });

const Grade = mongoose.model("Grade", gradeSchema);
export default Grade;
