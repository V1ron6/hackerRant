const authService = require('../services/auth.service');
const otpService  = require('../services/otp.service');
const emailQueue  = require('../queues/email.queue');
const { created, ok, badRequest } = require('../utils/response');

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { username, email, phone, password } = req.body;

    const user = await authService.registerUser({ username, email, phone, password });

    // Generate and queue OTP email
    const otp = await otpService.createOtp(email, 'register');

    await emailQueue.add('send-otp', {
      to:      email,
      subject: 'Your hackerRant verification code',
      text:    `Your OTP is: ${otp}. Expires in 10 minutes.`,
    });

    return created(res, { userId: user.id }, 'Check your email for the OTP');
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const valid = await otpService.verifyOtp(email, 'register', otp);

    if (!valid) {
      return badRequest(res, 'Invalid or expired OTP');
    }

    // Find user and issue ticket
    const { User } = require('../models');
    const user     = await User.findOne({ where: { email } });

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
  return ok(res, user);
};
