const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
    match: [/^\d{2}\/\d{2}$/, 'Academic year must be in format YY/YY'],
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
  reason: {
    type: String,
    enum: ['completion', 'semester-end'],
    required: true,
  },
  notifiedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

notificationLogSchema.index(
  { subjectId: 1, department: 1, academicYear: 1, year: 1, semester: 1 },
  { unique: true }
);

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
