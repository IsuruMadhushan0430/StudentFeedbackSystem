const Department = require('../models/Department');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const Semester = require('../models/Semester');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const xlsx = require('xlsx');
const { validationResult } = require('express-validator');
const { sendStudentWelcomeEmail } = require('../utils/email');

exports.addDepartment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;

  try {
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = new Department({ name });
    await department.save();
    res.json(department);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.addSubject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, department, semester, lecturerId, academicYear } = req.body;

  try {
    let lecturerDoc = null;
    if (lecturerId) {
      lecturerDoc = await Lecturer.findOne({ userId: lecturerId });
      if (!lecturerDoc) {
        return res.status(400).json({ message: 'Selected user is not a valid lecturer' });
      }
    }

    const subject = new Subject({
      name,
      department,
      semester,
      academicYear: academicYear || null,
      lecturerId: lecturerDoc?._id || null,
    });
    await subject.save();
    res.json(subject);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.assignLecturerToSubject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { subjectId } = req.params;
  const { lecturerId, academicYear } = req.body;

  try {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const lecturerDoc = await Lecturer.findOne({ userId: lecturerId });
    if (!lecturerDoc) {
      return res.status(400).json({ message: 'Selected user is not a valid lecturer' });
    }

    subject.lecturerId = lecturerDoc._id;
    subject.academicYear = academicYear;
    await subject.save();

    const populated = await Subject.findById(subjectId).populate('department').populate({
      path: 'lecturerId',
      populate: { path: 'userId', select: 'name email' },
    });

    res.json(populated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'student') {
      await Student.findOneAndDelete({ userId });
    } else if (user.role === 'lecturer') {
      await Lecturer.findOneAndDelete({ userId });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.setSemester = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { department, semester, startDate, endDate, academicYear } = req.body;

  try {
    const updatedSemester = await Semester.findOneAndUpdate(
      { department, semester },
      { startDate, endDate, academicYear },
      { new: true, upsert: true }
    );
    res.json(updatedSemester);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateSemester = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { semesterId } = req.params;
  const { startDate, endDate, academicYear } = req.body;

  try {
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: 'Semester not found' });
    }

    semester.startDate = startDate;
    semester.endDate = endDate;
    semester.academicYear = academicYear;
    await semester.save();

    res.json(semester);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const departments = await Department.find();
    
    const students = await Student.find()
      .populate({
        path: 'userId',
        select: 'name email department',
        populate: { path: 'department', select: 'name' },
      });
    const lecturers = await User.find({ role: 'lecturer' }).populate('department').select('-password');
    const subjects = await Subject.find().populate('department').populate({
      path: 'lecturerId',
      populate: {
        path: 'userId',
        select: 'name email'
      }
    });
    const semesters = await Semester.find().populate('department');

    res.json({
      departments,
      students,
      lecturers,
      subjects,
      semesters
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    await Department.findByIdAndDelete(departmentId);
    res.json({ message: 'Department deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    await Subject.findByIdAndDelete(subjectId);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false, role: 'lecturer' })
      .populate('department', 'name')
      .select('-password');
    res.json(pendingUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateUserApproval = async (req, res) => {
  const { userId } = req.params;
  const { approve } = req.body; // Expecting a boolean: true for approve, false for reject

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (approve) {
      user.isApproved = true;
      await user.save();
      res.json({ message: 'User approved successfully', user });
    } else {
      // Rejection means deletion
      if (user.role === 'student') {
        await Student.findOneAndDelete({ userId });
      } else if (user.role === 'lecturer') {
        await Lecturer.findOneAndDelete({ userId });
      }
      await User.findByIdAndDelete(userId);
      res.json({ message: 'User rejected and deleted' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const normalizeAcademicYear = (value) => {
  if (!value) return '';
  const cleaned = value.trim().replace(/-/g, '/');
  const fourDigit = cleaned.match(/^(\d{4})\s*\/\s*(\d{4})$/);
  if (fourDigit) {
    return `${fourDigit[1].slice(-2)}/${fourDigit[2].slice(-2)}`;
  }
  const twoDigit = cleaned.match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (twoDigit) {
    return `${twoDigit[1]}/${twoDigit[2]}`;
  }
  return cleaned;
};

const generateTempPassword = () => {
  let password = '';
  while (password.length < 8) {
    password = crypto.randomBytes(9)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10);
  }
  return password;
};

exports.importStudents = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Excel file is required' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });

    if (rawRows.length === 0) {
      return res.status(400).json({ message: 'No rows found in Excel file' });
    }

    const departments = await Department.find({}, 'name');
    const departmentMap = new Map(
      departments.map((dep) => [dep.name.trim().toLowerCase(), dep])
    );

    const emails = rawRows
      .map((row) => {
        const normalized = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = String(key || '').trim().toLowerCase();
          normalized[normalizedKey] = String(row[key] ?? '').trim();
        });
        return (normalized.email || '').toLowerCase();
      })
      .filter(Boolean);

    const existingUsers = await User.find({ email: { $in: emails } }, 'email');
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

    const results = {
      imported: 0,
      skipped: 0,
      failed: [],
    };

    for (let i = 0; i < rawRows.length; i += 1) {
      const rowNumber = i + 2;
      const rawRow = rawRows[i];
      const normalized = {};

      Object.keys(rawRow).forEach((key) => {
        const normalizedKey = String(key || '').trim().toLowerCase();
        normalized[normalizedKey] = String(rawRow[key] ?? '').trim();
      });

      const name = normalized.name || '';
      const email = (normalized.email || '').toLowerCase();
      const departmentName = (normalized.department || '').toLowerCase();
      const year = normalized.year || '';
      const semester = normalized.semester || '';
      const academicYearRaw = normalized.academicyear || normalized['academic year'] || '';
      const academicYear = normalizeAcademicYear(academicYearRaw);

      if (!name || !email || !departmentName || !year || !semester || !academicYear) {
        results.failed.push({ row: rowNumber, email: email || 'N/A', reason: 'Missing required fields' });
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.failed.push({ row: rowNumber, email, reason: 'Invalid email format' });
        continue;
      }

      if (!['Year I', 'Year II', 'Year III'].includes(year)) {
        results.failed.push({ row: rowNumber, email, reason: 'Invalid year' });
        continue;
      }

      if (!['Semester I', 'Semester II'].includes(semester)) {
        results.failed.push({ row: rowNumber, email, reason: 'Invalid semester' });
        continue;
      }

      if (!/^\d{2}\/\d{2}$/.test(academicYear)) {
        results.failed.push({ row: rowNumber, email, reason: 'Invalid academic year' });
        continue;
      }

      const department = departmentMap.get(departmentName);
      if (!department) {
        results.failed.push({ row: rowNumber, email, reason: 'Department not found' });
        continue;
      }

      if (existingEmails.has(email)) {
        results.skipped += 1;
        continue;
      }

      const tempPassword = generateTempPassword();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      let user = null;

      try {
        user = new User({
          name,
          email,
          password: hashedPassword,
          role: 'student',
          department: department._id,
          isApproved: true,
          mustResetPassword: true,
        });

        await user.save();

        const student = new Student({
          userId: user._id,
          year,
          semester,
          academicYear,
        });

        await student.save();
        existingEmails.add(email);
        results.imported += 1;

        try {
          await sendStudentWelcomeEmail({
            to: email,
            name,
            tempPassword,
            loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`,
          });
        } catch (emailErr) {
          results.failed.push({
            row: rowNumber,
            email,
            reason: 'Email failed after account creation',
          });
        }
      } catch (rowErr) {
        if (user?._id) {
          await User.findByIdAndDelete(user._id);
          await Student.findOneAndDelete({ userId: user._id });
        }
        results.failed.push({ row: rowNumber, email, reason: 'Failed to create account' });
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};