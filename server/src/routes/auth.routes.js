const router       = require('express').Router();
const authCtrl     = require('../controllers/auth.controller');
const meliodas     = require('../middleware/abuse/meliodas');
const ban          = require('../middleware/validation/ban');
const authenticate = require('../middleware/auth/authenticate');
const gowther      = require('../middleware/auth/gowther');
const merlin       = require('../middleware/security/merlin');
const {
  registerRules,
  loginRules,
  otpRules,
  emailRules,
  confirmResetRules,
} = require('../middleware/validation/auth.validation');

router.post('/register',    registerRules, ban, authCtrl.register);
router.post('/resend-otp',  meliodas, emailRules, ban, authCtrl.resendOtp);
router.post('/verify-otp',  otpRules,      ban, authCtrl.verifyOtp);
router.post('/login',       meliodas, loginRules, ban, authCtrl.login);
router.post('/logout',      authenticate, merlin.verifyToken, authCtrl.logout);
router.get('/me',           authenticate, merlin.generateToken, authCtrl.me);

// Ticket management (buildi.txt: Danger Zone / lost device)
router.post('/ticket/change',        authenticate, gowther, merlin.verifyToken, authCtrl.changeTicket);
router.post('/ticket/request-reset', meliodas, emailRules, ban, authCtrl.requestReset);
router.post('/ticket/confirm-reset', meliodas, confirmResetRules, ban, authCtrl.confirmReset);

module.exports = router;
