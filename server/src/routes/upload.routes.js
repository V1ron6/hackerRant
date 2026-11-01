const router       = require('express').Router();
const ctrl         = require('../controllers/upload.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const hawk         = require('../middleware/abuse/hawk');

router.post('/', authenticate, merlin.verifyToken, hawk, ctrl.upload);

module.exports = router;
