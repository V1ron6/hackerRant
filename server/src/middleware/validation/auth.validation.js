const { body } = require('express-validator');

const email = () => body('email').trim().toLowerCase().isEmail().withMessage('Invalid email');

exports.registerRules = [
  body('username')
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, underscores'),

  email(),

  body('phone')
    .trim()
    .isMobilePhone()
    .withMessage('Invalid phone number'),

  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('Password must be 8–72 characters'),
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
  email(),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
];

exports.emailRules = [email()];

exports.confirmResetRules = [
  ...exports.otpRules,
  body('password').notEmpty().withMessage('Password required'),
];
