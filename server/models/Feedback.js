const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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
  ratings: {
    type: [Number],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length === 10 && arr.every(r => r >= 1 && r <= 5);
      },
      message: 'Ratings must be an array of 10 numbers between 1 and 5',
    },
  },
  comment: {
    type: String,
    default: '',
  },
}, { timestamps: true });

feedbackSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);