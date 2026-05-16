const { body } = require('express-validator');

exports.registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, underscores'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),

  body('phone')
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

exports.loginRules = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Email or username required'),

  body('password')
    .notEmpty()
    .withMessage('Password required'),
];

exports.otpRules = [
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
];
