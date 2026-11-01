const router       = require('express').Router();
const { body }     = require('express-validator');
const ctrl         = require('../controllers/resource.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const ban          = require('../middleware/validation/ban');

router.use(authenticate);

router.get('/', ctrl.list);

// https only: the client renders this as a link, so javascript:/data: must never get in.
router.post('/', merlin.verifyToken,
  body('title').isString().trim().isLength({ min: 2, max: 120 }),
  body('url').isString().trim().isURL({ protocols: ['https'], require_protocol: true }).withMessage('URL must be https'),
  body('description').optional().isString().trim().isLength({ max: 300 }),
  body('category').optional().isString().trim().isLength({ min: 1, max: 50 }),
  ban, ctrl.create);

module.exports = router;
