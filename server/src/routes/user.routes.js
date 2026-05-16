const router       = require('express').Router();
const userCtrl     = require('../controllers/user.controller');
const authenticate = require('../middleware/auth/authenticate');
const gowther      = require('../middleware/auth/gowther');
const merlin       = require('../middleware/security/merlin');

router.get('/:username',  userCtrl.getProfile);
router.patch('/me',       authenticate, gowther, merlin.verifyToken, userCtrl.updateProfile);

module.exports = router;
