const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const Department = require('../models/Department');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role, department, year, semester } = req.body;
  const academicYear = (req.body.academicYear || '').trim();

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is not allowed' });
    }

    if (role === 'hod') {
      return res.status(403).json({ message: 'HOD registration is not allowed' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      isApproved: false,
    });

    await user.save();

    if (role === 'student') {
      if (!academicYear || !/^\d{2}\/\d{2}$/.test(academicYear)) {
        return res.status(400).json({ message: 'Academic year is required in format YY/YY (e.g., 21/22)' });
      }
      const student = new Student({
        userId: user._id,
        year,
        semester,
        academicYear,
      });
      await student.save();
    } else if (role === 'lecturer') {
      const lecturer = new Lecturer({
        userId: user._id,
        department,
      });
      await lecturer.save();
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
      if (err) {
        console.error('JWT Sign Error:', err);
        return res.status(500).send('Server error');
      }
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, mustResetPassword: user.mustResetPassword } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('department');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Account is pending approval' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({});
    res.json(departments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a reset link has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    user.mustResetPassword = false;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);

    const response = {
      message: 'Password reset link generated. Please check the server console or email service integration.',
    };

    if (process.env.NODE_ENV !== 'production') {
      response.resetToken = resetToken;
      response.resetUrl = resetUrl;
    }

    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token } = req.params;
  const { password } = req.body;

  try {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};