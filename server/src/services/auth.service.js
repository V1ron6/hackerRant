const bcrypt         = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User, Ticket, Session } = require('../models');
const { generateTicket }        = require('../utils/ticket');
const fingerprint               = require('../utils/fingerprint');
const auditService              = require('./audit.service');

// ─── Register (step 1 — pre-OTP) ─────────────────────────────────────────────
exports.registerUser = async ({ username, email, phone, password }) => {
  const existing = await User.findOne({
    where: { email },
  });

  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const user = await User.create({
    id: uuidv4(),
    username,
    email,
    phone,
    password_hash,
    status: 'active',
  });

  return user;
};

// ─── Login — verify credentials, return user ─────────────────────────────────
exports.loginUser = async (identifier, password) => {
  const user = await User.findOne({
    where: identifier.includes('@')
      ? { email: identifier }
      : { username: identifier },
  });

  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  if (user.status !== 'active') {
    throw Object.assign(new Error('Account suspended'), { status: 403 });
  }

  return user;
};

// ─── Issue ticket + cookie ─────────────────────────────────────────────────
exports.issueTicket = async (req, res, user) => {
  const fp            = fingerprint(req);
  const partialIP     = (req.ip || '').split('.').slice(0, 2).join('.');
  const { raw, hash, expiresAt } = await generateTicket();

  await Ticket.create({
    id:         uuidv4(),
    user_id:    user.id,
    token_hash: hash,
    fingerprint: fp,
    partial_ip:  partialIP,
    expires_at:  expiresAt,
  });

  // Create session record
  await Session.create({
    id:          uuidv4(),
    user_id:     user.id,
    fingerprint: fp,
    user_agent:  req.headers['user-agent'] || '',
    ip_address:  req.ip,
  });

  // NOTE: sameSite must be 'none' for cross-origin (Vercel ↔ Render)
  res.cookie('hr_ticket', raw, {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    maxAge:   90 * 24 * 60 * 60 * 1000,
  });

  await auditService.log(user.id, 'LOGIN', { ip: req.ip });
};

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.revokeTicket = async (req, res, userId) => {
  const fp = fingerprint(req);

  await Ticket.update(
    { is_blacklisted: true },
    { where: { user_id: userId, fingerprint: fp } }
  );

  await Session.update(
    { is_revoked: true },
    { where: { user_id: userId, fingerprint: fp } }
  );

  res.clearCookie('hr_ticket', { sameSite: 'none', secure: true });

  await auditService.log(userId, 'LOGOUT', { ip: req.ip });
};
