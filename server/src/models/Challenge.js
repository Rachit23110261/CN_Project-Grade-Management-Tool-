import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description for the challenge"],
      trim: true,
    },
    attachmentUrl: {
      type: String, // URL or path to uploaded file
      default: null,
    },
    attachmentName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
    professorResponse: {
      type: String,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Populate student, course, and grade info when querying
challengeSchema.pre(/^find/, function (next) {
  this.populate({
    path: "student",
    select: "name email",
  })
    .populate({
      path: "course",
      select: "name code professor policy quizCount",
    })
    .populate({
      path: "grade",
      select: "marks",
    });
  next();
});

const Challenge = mongoose.model("Challenge", challengeSchema);

export default Challenge;
