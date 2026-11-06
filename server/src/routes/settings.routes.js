const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/settings.controller');
const { THEMES, MESSAGE_AUDIENCES } = require('../services/settings.service');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const ban          = require('../middleware/validation/ban');

router.use(authenticate);

router.get('/', ctrl.get);

router.patch('/', merlin.verifyToken,
  body('notifications').optional().isBoolean({ strict: true }),
  body('share_location').optional().isBoolean({ strict: true }),
  body('read_receipts').optional().isBoolean({ strict: true }),
  body('who_can_message').optional().isIn(MESSAGE_AUDIENCES).withMessage('Invalid option'),
  body('chat_theme').optional().isIn(THEMES).withMessage('Unknown theme'),
  ban, ctrl.update);

module.exports = router;
