const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  year: {
    type: String,
    enum: ['Year I', 'Year II', 'Year III'],
    required: true,
  },
  semester: {
    type: String,
    enum: ['Semester I', 'Semester II'],
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
    match: [/^\d{2}\/\d{2}$/, 'Academic year must be in format YY/YY'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);