const mongoose = require('mongoose');
const Lecturer = require('../models/Lecturer');
const Feedback = require('../models/Feedback');
const Subject = require('../models/Subject');
const User = require('../models/User');

exports.getFeedback = async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({ userId: req.user.id });
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    const feedbacks = await Feedback.find({ lecturerId: lecturer._id }).populate('subjectId', 'name');
    res.json(feedbacks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getReport = async (req, res) => {
  try {
    const { academicYear, year, semester, department, subject } = req.query;

    if ((year && !semester) || (!year && semester)) {
      return res.status(400).json({ message: 'Both year and semester are required to filter by term' });
    }

    const subjectFilter = {};

    if (academicYear) {
      subjectFilter.academicYear = academicYear;
    }

    if (year && semester) {
      subjectFilter.semester = `${year} ${semester}`;
    }

    if (subject) {
      if (!mongoose.Types.ObjectId.isValid(subject)) {
        return res.status(400).json({ message: 'Invalid subject filter' });
      }
      subjectFilter._id = subject;
    }

    if (req.user?.role === 'lecturer') {
      const lecturer = await Lecturer.findOne({ userId: req.user.id });
      if (!lecturer) {
        return res.status(404).json({ message: 'Lecturer not found' });
      }
      subjectFilter.lecturerId = lecturer._id;
    } else if (req.user?.role === 'hod') {
      const hodUser = await User.findById(req.user.id).select('department');
      if (!hodUser?.department) {
        return res.status(400).json({ message: 'HOD department not found' });
      }
      subjectFilter.department = hodUser.department;
    } else if (req.user?.role === 'admin') {
      if (department) {
        if (!mongoose.Types.ObjectId.isValid(department)) {
          return res.status(400).json({ message: 'Invalid department filter' });
        }
        subjectFilter.department = department;
      }
    } else {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subjects = await Subject.find(subjectFilter).select('_id name').lean();
    if (!subjects.length) {
      return res.json([]);
    }

    const subjectIds = subjects.map((s) => s._id);
    const feedbacks = await Feedback.find({ subjectId: { $in: subjectIds } })
      .select('subjectId ratings')
      .lean();

    const reportMap = new Map(
      subjects.map((subjectDoc) => [
        String(subjectDoc._id),
        {
          subjectId: subjectDoc._id,
          subject: subjectDoc.name,
          totalFeedbacks: 0,
          ratingsSum: new Array(10).fill(0),
        },
      ])
    );

    feedbacks.forEach((fb) => {
      const key = String(fb.subjectId);
      const entry = reportMap.get(key);
      if (!entry) return;
      entry.totalFeedbacks += 1;
      entry.ratingsSum = entry.ratingsSum.map((sum, idx) => sum + (fb.ratings[idx] || 0));
    });

    const reports = Array.from(reportMap.values()).map((entry) => {
      if (!entry.totalFeedbacks) {
        return {
          subjectId: entry.subjectId,
          subject: entry.subject,
          totalFeedbacks: 0,
          averageRatings: [],
          overallAverage: 0,
        };
      }

      const averageRatings = entry.ratingsSum.map((sum) => sum / entry.totalFeedbacks);
      const overallAverage = averageRatings.reduce((acc, value) => acc + value, 0) / 10;

      return {
        subjectId: entry.subjectId,
        subject: entry.subject,
        totalFeedbacks: entry.totalFeedbacks,
        averageRatings,
        overallAverage,
      };
    });

    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({ userId: req.user.id });
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    const subjects = await Subject.find({ lecturerId: lecturer._id })
      .populate('department', 'name')
      .sort({ semester: 1 });

    res.json(subjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};