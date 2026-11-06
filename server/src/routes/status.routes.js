const router       = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl         = require('../controllers/status.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const hawk         = require('../middleware/abuse/hawk');
const ban          = require('../middleware/validation/ban');

router.use(authenticate);

router.get('/', query('scope').optional().isIn(['all', 'following']), ban, ctrl.list);

router.post('/', merlin.verifyToken, hawk,
  body('kind').isIn(['text', 'image', 'video', 'audio']).withMessage('Invalid kind'),
  body('text').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('Text is too long (max 500)'),
  body('media_url').optional({ nullable: true }).isString().isLength({ max: 500 }),
  body('visibility').optional().isIn(['public', 'followers']).withMessage('Invalid visibility'),
  ban, ctrl.create);

router.post('/:id/view',    merlin.verifyToken, param('id').isUUID(), ban, ctrl.view);
router.get('/:id/viewers',  param('id').isUUID(), ban, ctrl.viewers);
router.delete('/:id', merlin.verifyToken, param('id').isUUID(), ban, ctrl.remove);

module.exports = router;
