const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Lecturer', lecturerSchema);