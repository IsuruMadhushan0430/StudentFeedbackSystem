const Lecturer = require('../models/Lecturer');
const Feedback = require('../models/Feedback');
const Subject = require('../models/Subject');

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
    const lecturer = await Lecturer.findOne({ userId: req.user.id });
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }

    const subjects = await Subject.find({ lecturerId: lecturer._id });

    const reports = await Promise.all(subjects.map(async (subject) => {
      const feedbacks = await Feedback.find({ subjectId: subject._id });

      if (feedbacks.length === 0) {
        return {
          subjectId: subject._id,
          subject: subject.name,
          totalFeedbacks: 0,
          averageRatings: [],
          overallAverage: 0,
          comments: [],
        };
      }

      const ratingsSum = feedbacks.reduce((acc, fb) => {
        return acc.map((sum, i) => sum + fb.ratings[i]);
      }, new Array(10).fill(0));

      const averageRatings = ratingsSum.map(sum => sum / feedbacks.length);
      const overallAverage = averageRatings.reduce((a, b) => a + b, 0) / 10;

      const comments = feedbacks.map(fb => fb.comment).filter(c => c);

      return {
        subjectId: subject._id,
        subject: subject.name,
        totalFeedbacks: feedbacks.length,
        averageRatings,
        overallAverage,
        comments,
      };
    }));

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