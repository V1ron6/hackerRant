const router       = require('express').Router();
const { query }    = require('express-validator');
const ctrl         = require('../controllers/discovery.controller');
const authenticate = require('../middleware/auth/authenticate');
const ban          = require('../middleware/validation/ban');

router.use(authenticate);

router.get('/search', query('q').isString().isLength({ min: 2, max: 30 }).withMessage('Type at least 2 characters'), ban, ctrl.search);

router.get('/nearby',
  query('lat').isFloat({ min: -90, max: 90 }),
  query('lng').isFloat({ min: -180, max: 180 }),
  query('radiusKm').optional().isFloat({ min: 1, max: 100 }),
  ban, ctrl.nearby);

module.exports = router;
