const Department = require('../models/Department');
const Subject = require('../models/Subject');
const User = require('../models/User');
const Student = require('../models/Student');
const Lecturer = require('../models/Lecturer');
const Semester = require('../models/Semester');
const { validationResult } = require('express-validator');

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
    // Fetch students with their user profile and department, plus year/semester
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