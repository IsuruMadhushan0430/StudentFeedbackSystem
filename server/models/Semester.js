const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  semester: {
    type: String,
    enum: ['Year I Semester I', 'Year I Semester II', 'Year II Semester I', 'Year II Semester II', 'Year III Semester I', 'Year III Semester II'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  academicYear: {
    type: String,
    match: /^\d{2}\/\d{2}$/,
    required: true,
  },
}, { timestamps: true });

// Ensure unique semester per department
semesterSchema.index({ department: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);