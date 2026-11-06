const router       = require('express').Router();
const { param }    = require('express-validator');
const ctrl         = require('../controllers/social.controller');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const hawk         = require('../middleware/abuse/hawk');
const ban          = require('../middleware/validation/ban');

const username = param('username').trim().toLowerCase().matches(/^[a-z0-9_]{3,30}$/).withMessage('Invalid username');

router.use(authenticate);

router.get('/following', ctrl.following);
router.get('/followers', ctrl.followers);
router.get('/blocked',   ctrl.blocked);
router.get('/relationship/:username', username, ban, ctrl.relationship);

router.post('/follow/:username',    merlin.verifyToken, hawk, username, ban, ctrl.follow);
router.delete('/follow/:username',  merlin.verifyToken, username, ban, ctrl.unfollow);
router.post('/block/:username',     merlin.verifyToken, hawk, username, ban, ctrl.block);
router.delete('/block/:username',   merlin.verifyToken, username, ban, ctrl.unblock);

module.exports = router;
