const router       = require('express').Router();
const sessionCtrl  = require('../controllers/session.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');

router.use(authenticate);

router.get('/',       merlin.generateToken, sessionCtrl.listSessions);
router.delete('/',    merlin.verifyToken,   sessionCtrl.revokeAll);
router.delete('/:id', merlin.verifyToken,   sessionCtrl.revokeSession);

module.exports = router;
