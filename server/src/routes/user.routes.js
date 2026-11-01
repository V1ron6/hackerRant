const router       = require('express').Router();
const { body }     = require('express-validator');
const userCtrl     = require('../controllers/user.controller');
const authenticate = require('../middleware/auth/authenticate');
const gowther      = require('../middleware/auth/gowther');
const merlin       = require('../middleware/security/merlin');
const ban          = require('../middleware/validation/ban');

const opt = { nullable: true, checkFalsy: true }; // '' / null clear the field

const profileRules = [
  body('first_name').optional(opt).isString().trim().isLength({ max: 50 }),
  body('last_name').optional(opt).isString().trim().isLength({ max: 50 }),
  body('bio').optional(opt).isString().trim().isLength({ max: 500 }).withMessage('Bio is too long (max 500)'),
  body('dob').optional(opt).isISO8601({ strict: true }).withMessage('Invalid date of birth')
    .custom((v) => new Date(v) < new Date()).withMessage('Date of birth must be in the past'),
  body('avatar_url').optional(opt).isString().isLength({ max: 500 }),
  body('latitude').optional({ nullable: true }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }),
];

router.get('/:username',  userCtrl.getProfile);
router.patch('/me',       authenticate, gowther, merlin.verifyToken, profileRules, ban, userCtrl.updateProfile);
router.delete('/me',      authenticate, gowther, merlin.verifyToken,
  body('password').isString().notEmpty().withMessage('Password required'), ban, userCtrl.deleteAccount);

module.exports = router;
