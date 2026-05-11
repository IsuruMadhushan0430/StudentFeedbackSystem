const express = require('express');
const lecturerController = require('../controllers/lecturerController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/feedback', auth, roleAuth(['lecturer', 'hod']), lecturerController.getFeedback);

router.get('/report', auth, roleAuth(['lecturer', 'hod']), lecturerController.getReport);
router.get('/subjects', auth, roleAuth(['lecturer', 'hod']), lecturerController.getSubjects);

module.exports = router;