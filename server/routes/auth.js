const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['student', 'lecturer', 'admin']).withMessage('Invalid role'),
  body('department')
    .if((value, { req }) => req.body.role !== 'admin')
    .notEmpty().withMessage('Department is required for students and lecturers')
    .isMongoId().withMessage('Valid department ID required'),
  body('year').if((value, { req }) => req.body.role === 'student').isIn(['Year I', 'Year II', 'Year III']).withMessage('Invalid year'),
  body('semester').if((value, { req }) => req.body.role === 'student').isIn(['Semester I', 'Semester II']).withMessage('Invalid semester'),
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], authController.login);

router.get('/departments', authController.getDepartments);

module.exports = router;