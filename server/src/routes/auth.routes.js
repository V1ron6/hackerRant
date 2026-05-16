const router       = require('express').Router();
const authCtrl     = require('../controllers/auth.controller');
const meliodas     = require('../middleware/abuse/meliodas');
const ban          = require('../middleware/validation/ban');
const authenticate = require('../middleware/auth/authenticate');
const merlin       = require('../middleware/security/merlin');
const {
  registerRules,
  loginRules,
  otpRules,
} = require('../middleware/validation/auth.validation');

router.post('/register',    registerRules, ban, authCtrl.register);
router.post('/verify-otp',  otpRules,      ban, authCtrl.verifyOtp);
router.post('/login',       meliodas, loginRules, ban, authCtrl.login);
router.post('/logout',      authenticate, merlin.verifyToken, authCtrl.logout);
router.get('/me',           authenticate, merlin.generateToken, authCtrl.me);

module.exports = router;
