const Student = require('../models/Student');
const Semester = require('../models/Semester');
const User = require('../models/User');

// Map current semester label to the next year/semester pair
const nextMap = {
  'Year I Semester I': { year: 'Year I', semester: 'Semester II' },
  'Year I Semester II': { year: 'Year II', semester: 'Semester I' },
  'Year II Semester I': { year: 'Year II', semester: 'Semester II' },
  'Year II Semester II': { year: 'Year III', semester: 'Semester I' },
  'Year III Semester I': { year: 'Year III', semester: 'Semester II' },
};

// Split the combined semester label stored on Semester docs
const semesterParts = {
  'Year I Semester I': { year: 'Year I', semester: 'Semester I' },
  'Year I Semester II': { year: 'Year I', semester: 'Semester II' },
  'Year II Semester I': { year: 'Year II', semester: 'Semester I' },
  'Year II Semester II': { year: 'Year II', semester: 'Semester II' },
  'Year III Semester I': { year: 'Year III', semester: 'Semester I' },
  'Year III Semester II': { year: 'Year III', semester: 'Semester II' },
};

async function advanceStudentsForEndedSemesters() {
  const now = new Date();

  // Find semesters that have ended; academicYear remains unchanged on student records
  const endedSemesters = await Semester.find({ endDate: { $lte: now } });
  if (!endedSemesters.length) return;

  for (const sem of endedSemesters) {
    const parts = semesterParts[sem.semester];
    const next = nextMap[sem.semester];
    if (!parts || !next) {
      // No next semester (e.g., Year III Semester II) or unknown label
      continue;
    }

    // Get all student userIds in this department
    const users = await User.find({ department: sem.department, role: 'student' }).select('_id');
    const userIds = users.map((u) => u._id);
    if (!userIds.length) continue;

    await Student.updateMany(
      {
        userId: { $in: userIds },
        year: parts.year,
        semester: parts.semester,
      },
      {
        year: next.year,
        semester: next.semester,
      }
    );
  }
}

function scheduleSemesterAdvancement() {
  // Run once on startup and then every 12 hours; lightweight check
  advanceStudentsForEndedSemesters().catch((err) => console.error('Semester advance failed', err));
  const twelveHours = 12 * 60 * 60 * 1000;
  setInterval(() => {
    advanceStudentsForEndedSemesters().catch((err) => console.error('Semester advance failed', err));
  }, twelveHours);
}

module.exports = { scheduleSemesterAdvancement };
