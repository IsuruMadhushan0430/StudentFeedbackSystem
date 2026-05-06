const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Feedback = require('../models/Feedback');
const FeedbackSubmission = require('../models/FeedbackSubmission');
const Semester = require('../models/Semester');
const { validationResult } = require('express-validator');

exports.getSubjects = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { department } = student.userId;

    const now = new Date();
    const activeSemesterDoc = await Semester.findOne({
      department: department,
      academicYear: student.academicYear,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const semesterStr = activeSemesterDoc?.semester || `${student.year} ${student.semester}`;

    const subjectYearFilter = [
      { academicYear: student.academicYear },
      { academicYear: null },
      { academicYear: { $exists: false } },
    ];

    const subjects = await Subject.find({ 
      department: department,
      semester: semesterStr,
      $or: subjectYearFilter,
    }).populate({
      path: 'lecturerId',
      populate: {
        path: 'userId',
        select: 'name',
      },
    });

    const submittedFeedback = await FeedbackSubmission.find({
      studentId: student._id,
      subjectId: { $in: subjects.map(s => s._id) },
    }).select('subjectId');

    const submittedMap = new Set(submittedFeedback.map(fb => fb.subjectId.toString()));

    const subjectsWithStatus = subjects.map((s) => ({
      ...s.toObject(),
      alreadySubmitted: submittedMap.has(s._id.toString()),
    }));

    let semesterDates = activeSemesterDoc || null;
    if (!semesterDates) {
      semesterDates = await Semester.findOne({ department: department, semester: semesterStr, academicYear: student.academicYear })
        || await Semester.findOne({ department: department, semester: semesterStr });
    }

    res.json({ subjects: subjectsWithStatus, semesterDates });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.submitFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { subjectId, lecturerId, ratings, comment } = req.body;

  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId');
    if (!student) {
      return res.status(404).json({ message: 'Student details not found' });
    }

    const { department } = student.userId;
    const semesterStr = `${student.year} ${student.semester}`;
    const semester = await Semester.findOne({ 
      department: department, 
      semester: semesterStr 
    });

    if (!semester) {
      return res.status(400).json({ message: 'Feedback period dates not configured for your department/semester' });
    }

    const feedbackStartDate = new Date(semester.endDate);
    feedbackStartDate.setDate(feedbackStartDate.getDate() - 14);

    const now = new Date();
    if (now < feedbackStartDate || now > semester.endDate) {
      return res.status(400).json({ 
        message: `Feedback submission is only allowed between ${feedbackStartDate.toLocaleDateString()} and ${new Date(semester.endDate).toLocaleDateString()}` 
      });
    }

  
    const existingFeedback = await FeedbackSubmission.findOne({
      subjectId,
      studentId: student._id,
    });

    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this subject.' });
    }

    if (!lecturerId) {
      return res.status(400).json({ message: 'Lecturer is not assigned for this subject yet.' });
    }

    const feedback = new Feedback({
      subjectId,
      lecturerId,
      ratings,
      comment,
    });

    await feedback.save();

    try {
      await FeedbackSubmission.create({
        studentId: student._id,
        subjectId,
        lecturerId,
        feedbackId: feedback._id,
      });
    } catch (submissionErr) {
      await Feedback.deleteOne({ _id: feedback._id });
      if (submissionErr?.code === 11000) {
        return res.status(400).json({ message: 'You have already submitted feedback for this subject.' });
      }
      throw submissionErr;
    }

    res.json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMyFeedback = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const submissions = await FeedbackSubmission.find({ studentId: student._id })
      .populate({
        path: 'feedbackId',
        populate: [
          { path: 'subjectId', select: 'name semester' },
          { path: 'lecturerId', populate: { path: 'userId', select: 'name' } },
        ],
      })
      .sort({ createdAt: -1 });

    const feedback = submissions.map((submission) => submission.feedbackId).filter(Boolean);
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};