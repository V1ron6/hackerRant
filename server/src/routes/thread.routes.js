const router       = require('express').Router();
const { body, param, query } = require('express-validator');
const ctrl         = require('../controllers/thread.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const hawk         = require('../middleware/abuse/hawk');
const ban          = require('../middleware/validation/ban');

const id = param('id').isUUID().withMessage('Invalid thread id');

router.use(authenticate);

router.get('/', query('cursor').optional().isISO8601(), ban, ctrl.list);
router.get('/:id', id, ban, ctrl.get);

router.post('/', merlin.verifyToken, hawk,
  body('title').isString().trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3–150 characters'),
  body('body').isString().trim().isLength({ min: 3, max: 3000 }).withMessage('Details must be 3–3000 characters'),
  ban, ctrl.create);

router.post('/:id/replies', merlin.verifyToken, hawk, id,
  body('body').isString().trim().isLength({ min: 1, max: 2000 }).withMessage('Reply must be 1–2000 characters'),
  ban, ctrl.reply);

router.delete('/:id', merlin.verifyToken, id, ban, ctrl.remove);

module.exports = router;
