const bcrypt         = require('bcryptjs');
const authService    = require('../services/auth.service');
const otpService     = require('../services/otp.service');
const sessionService = require('../services/session.service');
const emailQueue     = require('../queues/email.queue');
const escanor        = require('../middleware/abuse/escanor');
const { User }       = require('../models');
const { created, ok, badRequest } = require('../utils/response');

const queueOtp = (to, subject, text) =>
  emailQueue.add('send-otp', { to, subject, text });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { username, email, phone, password } = req.body;

    const user = await authService.registerUser({ username, email, phone, password });

    const otp = await otpService.createOtp(email, 'register');
    await queueOtp(email, 'Your hackerRant verification code', `Your OTP is: ${otp}. Expires in 10 minutes.`);

    return created(res, { userId: user.id }, 'Check your email for the OTP');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp   { email } — same answer whether or not the email exists
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user && !user.email_verified) {
      const otp = await otpService.createOtp(email, 'register');
      await queueOtp(email, 'Your hackerRant verification code', `Your OTP is: ${otp}. Expires in 10 minutes.`);
    }

    return ok(res, {}, 'If that email is waiting for verification, a new code was sent');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const valid = await otpService.verifyOtp(email, 'register', otp);
    if (!valid) return badRequest(res, 'Invalid or expired OTP');

    const user = await User.findOne({ where: { email } });
    if (!user) return badRequest(res, 'Invalid or expired OTP');
    if (user.status !== 'active') {
      throw Object.assign(new Error('Account suspended'), { status: 403 });
    }

    if (!user.email_verified) {
      user.email_verified = true;
      await user.save();
    }

    await authService.issueTicket(req, res, user);

    return ok(res, { username: user.username }, 'Verified');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const user = await authService.loginUser(identifier, password);

    await authService.issueTicket(req, res, user);

    return ok(res, { username: user.username }, 'Logged in');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    await authService.revokeTicket(req, res, req.user.id);
    return ok(res, {}, 'Logged out');
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  const { password_hash, ...user } = req.user.toJSON();
  return ok(res, { ...user, csrfToken: res.locals.csrfToken });
};

// POST /api/auth/ticket/change — rotate this device's ticket (same device binding)
exports.changeTicket = async (req, res, next) => {
  try {
    await escanor(req.user.id);
    await authService.issueTicket(req, res, req.user, 'TICKET_CHANGE');
    return ok(res, {}, 'New ticket issued for this device');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/ticket/request-reset   { email } — lost/new device: emails a code.
// Same answer whether or not the account exists.
exports.requestReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user && user.status === 'active' && user.email_verified) {
      const otp = await otpService.createOtp(email, 'ticket_reset');
      await queueOtp(email, 'Your hackerRant ticket reset code', `Your ticket reset code is: ${otp}. Expires in 10 minutes. If this wasn't you, ignore this email.`);
    }

    return ok(res, {}, 'If that account exists, a reset code was sent');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/ticket/confirm-reset   { email, otp, password }
// Email code AND password are both required. All old tickets/sessions are revoked
// (the lost device is cut off) and a ticket is issued to THIS device.
exports.confirmReset = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ where: { email } });

    const passwordOk = !!user && await bcrypt.compare(password, user.password_hash);
    const otpOk      = passwordOk && await otpService.verifyOtp(email, 'ticket_reset', otp);

    if (!passwordOk || !otpOk || user.status !== 'active') {
      return badRequest(res, 'Invalid code or password');
    }

    await escanor(user.id);
    await sessionService.revokeAllSessions(user.id);
    await authService.issueTicket(req, res, user, 'TICKET_RESET');

    return ok(res, { username: user.username }, 'New ticket issued for this device');
  } catch (err) {
    next(err);
  }
};
