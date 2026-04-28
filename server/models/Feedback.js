const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
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

module.exports = mongoose.model('Feedback', feedbackSchema);