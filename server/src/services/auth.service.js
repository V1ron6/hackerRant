const bcrypt         = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op }         = require('sequelize');
const { User, Ticket, Session } = require('../models');
const { generateTicket }        = require('../utils/ticket');
const fingerprint               = require('../utils/fingerprint');
const auditService              = require('./audit.service');

const fail = (status, message, code) => Object.assign(new Error(message), { status, code });

const RENEW_GRACE_MS = 5 * 60 * 1000;

// ─── Register (step 1 — pre-OTP) ─────────────────────────────────────────────
exports.registerUser = async ({ username, email, phone, password }) => {
  const byEmail = await User.findOne({ where: { email } });

  if (byEmail) {
    if (!byEmail.email_verified) {
      throw fail(409, 'This email is waiting for verification. Resend the code to continue.', 'EMAIL_NOT_VERIFIED');
    }
    throw fail(409, 'Email already registered');
  }

  if (await User.findOne({ where: { username } })) throw fail(409, 'Username already taken');
  if (await User.findOne({ where: { phone } }))    throw fail(409, 'Phone number already registered');

  const password_hash = await bcrypt.hash(password, 12);

  return User.create({
    id: uuidv4(),
    username,
    email,
    phone,
    password_hash,
    status: 'active',
  });
};

// ─── Login — verify credentials, return user ─────────────────────────────────
exports.loginUser = async (identifier, password) => {
  const id = identifier.trim().toLowerCase();

  const user = await User.findOne({
    where: id.includes('@') ? { email: id } : { username: id },
  });

  if (!user) {
    throw fail(401, 'Invalid credentials');
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw fail(401, 'Invalid credentials');
  }

  if (user.status !== 'active') {
    throw fail(403, 'Account suspended');
  }

  if (!user.email_verified) {
    throw fail(403, 'Email not verified. Check your inbox or resend the code.', 'EMAIL_NOT_VERIFIED');
  }

  return user;
};

// ─── Issue ticket + cookie ─────────────────────────────────────────────────
// One live ticket per device: a new login/change blacklists the device's earlier
// tickets. (Otherwise they pile up and every lookup has more to check.)
// action 'TICKET_RENEW' is the 90-day auto-renewal: old tickets get a short grace
// period instead, so parallel in-flight requests don't strand the browser on a
// dead cookie, and no new session row is created.
exports.issueTicket = async (req, res, user, action = 'LOGIN') => {
  const fp        = fingerprint(req);
  const partialIP = (req.ip || '').split('.').slice(0, 2).join('.');
  const renewing  = action === 'TICKET_RENEW';
  const { raw, hash, expiresAt } = await generateTicket();

  if (renewing) {
    await Ticket.update(
      { expires_at: new Date(Date.now() + RENEW_GRACE_MS) },
      { where: { user_id: user.id, fingerprint: fp, is_blacklisted: false, expires_at: { [Op.gt]: new Date(Date.now() + RENEW_GRACE_MS) } } }
    );
  } else {
    await Ticket.update(
      { is_blacklisted: true },
      { where: { user_id: user.id, fingerprint: fp, is_blacklisted: false } }
    );
    await Session.update(
      { is_revoked: true },
      { where: { user_id: user.id, fingerprint: fp, is_revoked: false } }
    );
  }

  await Ticket.create({
    id:          uuidv4(),
    user_id:     user.id,
    token_hash:  hash,
    fingerprint: fp,
    partial_ip:  partialIP,
    expires_at:  expiresAt,
  });

  if (!renewing) {
    await Session.create({
      id:          uuidv4(),
      user_id:     user.id,
      fingerprint: fp,
      user_agent:  req.headers['user-agent'] || '',
      ip_address:  req.ip,
    });
  }

  // NOTE: sameSite must be 'none' for cross-origin (Vercel ↔ Render)
  res.cookie('hr_ticket', raw, {
    httpOnly: true,
    secure:   true,
    sameSite: 'none',
    maxAge:   90 * 24 * 60 * 60 * 1000,
  });

  await auditService.log(user.id, action, { ip: req.ip });
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
