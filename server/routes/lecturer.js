const express = require('express');
const lecturerController = require('../controllers/lecturerController');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

router.get('/feedback', auth, roleAuth(['lecturer']), lecturerController.getFeedback);

router.get('/report', auth, roleAuth(['lecturer']), lecturerController.getReport);
router.get('/subjects', auth, roleAuth(['lecturer']), lecturerController.getSubjects);

module.exports = router;