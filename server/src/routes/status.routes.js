const router       = require('express').Router();
const { body, param } = require('express-validator');
const ctrl         = require('../controllers/status.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const hawk         = require('../middleware/abuse/hawk');
const ban          = require('../middleware/validation/ban');

router.use(authenticate);

router.get('/', ctrl.list);

router.post('/', merlin.verifyToken, hawk,
  body('kind').isIn(['text', 'image', 'video', 'audio']).withMessage('Invalid kind'),
  body('text').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('Text is too long (max 500)'),
  body('media_url').optional({ nullable: true }).isString().isLength({ max: 500 }),
  ban, ctrl.create);

router.delete('/:id', merlin.verifyToken, param('id').isUUID(), ban, ctrl.remove);

module.exports = router;
