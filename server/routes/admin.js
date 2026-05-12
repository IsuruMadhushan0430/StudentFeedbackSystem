const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/department', [
  auth,
  roleAuth(['admin']),
  body('name').notEmpty().withMessage('Department name is required'),
], adminController.addDepartment);

router.post('/subject', [
  auth,
  roleAuth(['admin']),
  body('name').notEmpty().withMessage('Subject name is required'),
  body('department').isMongoId().withMessage('Valid department ID required'),
  body('semester').isIn(['Year I Semester I', 'Year I Semester II', 'Year II Semester I', 'Year II Semester II', 'Year III Semester I', 'Year III Semester II']).withMessage('Invalid semester'),
], adminController.addSubject);

router.put('/subject/:subjectId/assign-lecturer', [
  auth,
  roleAuth(['hod']),
  body('lecturerId').isMongoId().withMessage('Valid lecturer ID required'),
  body('academicYear').trim().matches(/^\d{2}\/\d{2}$/).withMessage('Academic year must be YY/YY'),
], adminController.assignLecturerToSubject);

router.delete('/user/:userId', auth, roleAuth(['admin']), adminController.deleteUser);

router.post('/semester', [
  auth,
  roleAuth(['hod']),
  body('department').isMongoId().withMessage('Valid department ID required'),
  body('semester').isIn(['Year I Semester I', 'Year I Semester II', 'Year II Semester I', 'Year II Semester II', 'Year III Semester I', 'Year III Semester II']).withMessage('Invalid semester'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('academicYear').trim().matches(/^\d{2}\/\d{2}$/).withMessage('Academic year must be YY/YY'),
], adminController.setSemester);

router.put('/semester/:semesterId', [
  auth,
  roleAuth(['hod']),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('academicYear').trim().matches(/^\d{2}\/\d{2}$/).withMessage('Academic year must be YY/YY'),
], adminController.updateSemester);

router.get('/dashboard-data', auth, roleAuth(['admin', 'hod']), adminController.getDashboardData);
router.delete('/department/:departmentId', auth, roleAuth(['admin']), adminController.deleteDepartment);
router.delete('/subject/:subjectId', auth, roleAuth(['admin']), adminController.deleteSubject);

router.get('/users/pending', auth, roleAuth(['admin']), adminController.getPendingUsers);
router.put('/users/:userId/approval', auth, roleAuth(['admin']), adminController.updateUserApproval);
router.put('/users/:userId/promote-hod', auth, roleAuth(['admin']), adminController.promoteToHod);
router.put('/users/:userId/demote-hod', auth, roleAuth(['admin']), adminController.demoteHod);
router.get('/feedback-report/pdf', auth, roleAuth(['admin']), adminController.downloadFeedbackReportsPdf);
router.post('/students/import', auth, roleAuth(['admin']), upload.single('file'), adminController.importStudents);
router.post('/lecturers/import', auth, roleAuth(['admin']), upload.single('file'), adminController.importLecturers);

module.exports = router;