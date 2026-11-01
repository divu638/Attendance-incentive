const mongoose = require("mongoose");
const { Schema } = mongoose;

const User = mongoose.model("User", new Schema({
  walletAddress: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, trim: true, maxlength: 80 },
  rollNo: { type: String, trim: true, maxlength: 30 },
  role: { type: String, enum: ["admin", "teacher", "student", "none"], default: "none" },
}, { timestamps: { createdAt: "createdAt", updatedAt: false } }));

const Session = mongoose.model("Session", new Schema({
  sessionId: { type: Number, required: true, unique: true },
  subject: String,
  date: Date,
  createdBy: String,
  txHash: String,
}));

const Attendance = mongoose.model("Attendance", new Schema({
  sessionId: { type: Number, required: true, index: true },
  student: { type: String, required: true, lowercase: true, index: true },
  status: { type: String, default: "present" },
  txHash: String,
  markedAt: Date,
}).index({ sessionId: 1, student: 1 }, { unique: true }));

const Reward = mongoose.model("Reward", new Schema({
  student: { type: String, required: true, lowercase: true, index: true },
  percent: Number,
  amountWei: String,
  txHash: { type: String, unique: true },
  claimedAt: Date,
}));

module.exports = { User, Session, Attendance, Reward };
