const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['student', 'lecturer', 'admin'],
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  mustResetPassword: {
    type: Boolean,
    default: false,
  },
  mustResetPassword: {
    type: Boolean,
    default: false,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.role !== 'admin';
    },
  },
}, { timestamps: true });

userSchema.pre('validate', async function(next) {
  if (this.role !== 'admin') {
    return next();
  }

  try {
    const existingAdmin = await mongoose.model('User').findOne({
      role: 'admin',
      _id: { $ne: this._id },
    });

    if (existingAdmin) {
      this.invalidate('role', 'Only one admin account is allowed');
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);