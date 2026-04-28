const mongoose = require('mongoose');

const feedbackSubmissionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  lecturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: true,
  },
  feedbackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    required: true,
  },
}, { timestamps: true });

feedbackSubmissionSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('FeedbackSubmission', feedbackSubmissionSchema);