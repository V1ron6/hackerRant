const router       = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl         = require('../controllers/reel.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const hawk         = require('../middleware/abuse/hawk');
const ban          = require('../middleware/validation/ban');

const id = param('id').isUUID();

router.use(authenticate);

router.get('/',
  query('scope').optional().isIn(['all', 'following']),
  query('cursor').optional().isISO8601(),
  ban, ctrl.feed);

router.post('/', merlin.verifyToken, hawk,
  body('video_url').isString().isLength({ max: 500 }),
  body('caption').optional({ nullable: true }).isString().isLength({ max: 150 }).withMessage('Caption is too long (max 150)'),
  body('visibility').optional().isIn(['public', 'followers']),
  ban, ctrl.create);

router.post('/:id/like',   merlin.verifyToken, id, ban, ctrl.like);
router.delete('/:id/like', merlin.verifyToken, id, ban, ctrl.unlike);
router.delete('/:id',      merlin.verifyToken, id, ban, ctrl.remove);

module.exports = router;
