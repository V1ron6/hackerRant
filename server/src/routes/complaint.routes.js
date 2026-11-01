const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/complaint.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const hawk         = require('../middleware/abuse/hawk');
const ban          = require('../middleware/validation/ban');

router.use(authenticate);

router.get('/', ctrl.list);

router.post('/', merlin.verifyToken, hawk,
  body('subject').isString().trim().isLength({ min: 3, max: 120 }).withMessage('Subject must be 3–120 characters'),
  body('message').isString().trim().isLength({ min: 10, max: 3000 }).withMessage('Message must be 10–3000 characters'),
  ban, ctrl.create);

module.exports = router;
