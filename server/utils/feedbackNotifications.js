const FeedbackSubmission = require('../models/FeedbackSubmission');
const NotificationLog = require('../models/NotificationLog');
const Semester = require('../models/Semester');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const User = require('../models/User');
const { sendFeedbackCompletionEmail } = require('./email');

const semesterParts = {
  'Year I Semester I': { year: 'Year I', semester: 'Semester I' },
  'Year I Semester II': { year: 'Year I', semester: 'Semester II' },
  'Year II Semester I': { year: 'Year II', semester: 'Semester I' },
  'Year II Semester II': { year: 'Year II', semester: 'Semester II' },
  'Year III Semester I': { year: 'Year III', semester: 'Semester I' },
  'Year III Semester II': { year: 'Year III', semester: 'Semester II' },
};

const buildBatchLabel = ({ academicYear, year, semester }) => {
  return `${academicYear} - ${year} ${semester}`;
};

const getRecipients = async ({ departmentId, lecturerUserId }) => {
  const recipients = [];

  const admin = await User.findOne({ role: 'admin' }).select('name email');
  if (admin?.email) {
    recipients.push({ name: admin.name, email: admin.email, role: 'admin' });
  }

  const hod = await User.findOne({ role: 'hod', department: departmentId }).select('name email');
  if (hod?.email) {
    recipients.push({ name: hod.name, email: hod.email, role: 'hod' });
  }

  if (lecturerUserId) {
    const lecturer = await User.findById(lecturerUserId).select('name email');
    if (lecturer?.email) {
      recipients.push({ name: lecturer.name, email: lecturer.email, role: 'lecturer' });
    }
  }

  return recipients;
};

const notifyFeedbackBatchOnce = async ({ subjectId, departmentId, academicYear, year, semester, reason }) => {
  const subject = await Subject.findById(subjectId).populate({
    path: 'lecturerId',
    populate: { path: 'userId', select: 'name email' },
  });

  if (!subject) return;
  if (!academicYear) {
    console.warn('Skipping feedback notification: missing academicYear', {
      subjectId,
      departmentId,
      year,
      semester,
      reason,
    });
    return;
  }

  let createdLog = null;
  try {
    createdLog = await NotificationLog.create({
      subjectId,
      department: departmentId,
      academicYear,
      year,
      semester,
      reason,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return;
    }
    throw err;
  }

  if (!createdLog) return;

  const lecturerUserId = subject.lecturerId?.userId?._id || null;
  const recipients = await getRecipients({ departmentId, lecturerUserId });
  if (!recipients.length) return;

  const batchLabel = buildBatchLabel({ academicYear, year, semester });
  const reasonText = reason === 'completion'
    ? 'All students in the batch have submitted feedback for this subject.'
    : 'The semester has ended.';

  await Promise.allSettled(
    recipients.map((recipient) => sendFeedbackCompletionEmail({
      to: recipient.email,
      name: recipient.name,
      subjectName: subject.name,
      batchLabel,
      reasonText,
    }))
  );
};

const checkAndNotifyBatchCompletion = async ({ subjectId, student }) => {
  const departmentId = student.userId?.department;
  if (!departmentId) return;

  const academicYear = student.academicYear;
  const year = student.year;
  const semester = student.semester;

  const studentUsers = await User.find({ role: 'student', department: departmentId }).select('_id');
  if (!studentUsers.length) return;

  const studentUserIds = studentUsers.map((u) => u._id);
  const batchStudents = await Student.find({
    userId: { $in: studentUserIds },
    academicYear,
    year,
    semester,
  }).select('_id');

  if (!batchStudents.length) return;

  const batchStudentIds = batchStudents.map((s) => s._id);
  const submissionCount = await FeedbackSubmission.countDocuments({
    subjectId,
    studentId: { $in: batchStudentIds },
  });

  if (submissionCount !== batchStudentIds.length) return;

  await notifyFeedbackBatchOnce({
    subjectId,
    departmentId,
    academicYear,
    year,
    semester,
    reason: 'completion',
  });
};

const processSemesterEndNotifications = async () => {
  const now = new Date();
  const endedSemesters = await Semester.find({ endDate: { $lte: now } });
  if (!endedSemesters.length) return;

  for (const sem of endedSemesters) {
    const parts = semesterParts[sem.semester];
    if (!parts) {
      continue;
    }

    const subjectYearFilter = [
      { academicYear: sem.academicYear },
      { academicYear: null },
      { academicYear: { $exists: false } },
    ];

    const subjects = await Subject.find({
      department: sem.department,
      semester: sem.semester,
      $or: subjectYearFilter,
    }).select('_id');

    for (const subject of subjects) {
      await notifyFeedbackBatchOnce({
        subjectId: subject._id,
        departmentId: sem.department,
        academicYear: sem.academicYear,
        year: parts.year,
        semester: parts.semester,
        reason: 'semester-end',
      });
    }
  }
};

const scheduleFeedbackNotifications = () => {
  processSemesterEndNotifications().catch((err) => console.error('Feedback notification check failed', err));
  const twelveHours = 12 * 60 * 60 * 1000;
  setInterval(() => {
    processSemesterEndNotifications().catch((err) => console.error('Feedback notification check failed', err));
  }, twelveHours);
};

module.exports = {
  checkAndNotifyBatchCompletion,
  scheduleFeedbackNotifications,
};
