const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  semester: {
    type: String,
    required: true,
    enum: ['Year I Semester I', 'Year I Semester II', 'Year II Semester I', 'Year II Semester II', 'Year III Semester I', 'Year III Semester II'],
  },
  academicYear: {
    type: String,
    required: false,
    default: null,
    match: [/^\d{2}\/\d{2}$/, 'Academic year must be in format YY/YY'],
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: false,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);