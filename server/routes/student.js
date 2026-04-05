const express = require('express');
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/subjects', auth, roleAuth(['student']), studentController.getSubjects);

router.post('/feedback', [
  auth,
  roleAuth(['student']),
  body('subjectId').isMongoId().withMessage('Valid subject ID required'),
  body('lecturerId').isMongoId().withMessage('Valid lecturer ID required'),
  body('ratings').isArray({ min: 10, max: 10 }).withMessage('Ratings must be an array of 10 numbers'),
  body('ratings.*').isInt({ min: 1, max: 5 }).withMessage('Each rating must be between 1 and 5'),
  body('comment').optional().isString(),
], studentController.submitFeedback);

router.get('/feedback', auth, roleAuth(['student']), studentController.getMyFeedback);

module.exports = router;