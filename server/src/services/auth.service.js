const bcrypt         = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { Op }         = require('sequelize');
const { User, Ticket, Session } = require('../models');
const { generateTicket, hashTicket } = require('../utils/ticket');
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
// A new login/change blacklists only the ticket THIS browser presented (not every
// ticket sharing the fingerprint, which would sign out other devices that look
// alike, e.g. two phones on one carrier), and live tickets per device are capped
// so they can't pile up.
// action 'TICKET_RENEW' is the 90-day auto-renewal: the old ticket gets a short
// grace period instead, so parallel in-flight requests don't strand the browser
// on a dead cookie, and no new session row is created.
const MAX_LIVE_TICKETS_PER_DEVICE = 5;

exports.issueTicket = async (req, res, user, action = 'LOGIN') => {
  const fp        = fingerprint(req);
  const partialIP = fingerprint.partialIp(req);
  const renewing  = action === 'TICKET_RENEW';
  const presented = typeof req.cookies?.hr_ticket === 'string' && req.cookies.hr_ticket
    ? hashTicket(req.cookies.hr_ticket)
    : null;

  if (renewing) {
    // Atomic claim: only the first of several parallel requests renews. The old
    // code shrank EVERY live ticket of the device to the 5-minute grace window,
    // including the fresh one a sibling request had just issued, so whichever
    // cookie won the race died five minutes later.
    const graceEnd = new Date(Date.now() + RENEW_GRACE_MS);
    const [claimed] = await Ticket.update(
      { expires_at: graceEnd },
      { where: { id: req.ticketId, is_blacklisted: false, expires_at: { [Op.gt]: graceEnd } } }
    );
    if (!claimed) return; // already renewed by a concurrent request
  } else if (presented) {
    await Ticket.update(
      { is_blacklisted: true },
      { where: { token_hash: presented, is_blacklisted: false } }
    );
  }

  const { raw, hash, expiresAt } = await generateTicket();

  await Ticket.create({
    id:          uuidv4(),
    user_id:     user.id,
    token_hash:  hash,
    fingerprint: fp,
    partial_ip:  partialIP,
    expires_at:  expiresAt,
  });

  if (!renewing) {
    // Cap live tickets for this user+device; blacklist the oldest extras.
    const live = await Ticket.findAll({
      where: { user_id: user.id, fingerprint: fp, is_blacklisted: false },
      order: [['created_at', 'DESC']],
      attributes: ['id'],
    });
    const extra = live.slice(MAX_LIVE_TICKETS_PER_DEVICE).map((t) => t.id);
    if (extra.length) {
      await Ticket.update({ is_blacklisted: true }, { where: { id: { [Op.in]: extra } } });
    }

    const existing = await Session.findOne({
      where: { user_id: user.id, fingerprint: fp, is_revoked: false },
    });
    if (existing) {
      await existing.update({
        last_active_at: new Date(),
        user_agent:     req.headers['user-agent'] || '',
        ip_address:     req.ip,
      });
    } else {
      await Session.create({
        id:          uuidv4(),
        user_id:     user.id,
        fingerprint: fp,
        user_agent:  req.headers['user-agent'] || '',
        ip_address:  req.ip,
      });
    }
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
// Ends this browser's ticket only; the device session is revoked once no live
// ticket remains for the fingerprint.
exports.revokeTicket = async (req, res, userId) => {
  const fp        = fingerprint(req);
  const presented = typeof req.cookies?.hr_ticket === 'string' && req.cookies.hr_ticket
    ? hashTicket(req.cookies.hr_ticket)
    : null;

  if (presented) {
    await Ticket.update(
      { is_blacklisted: true },
      { where: { user_id: userId, token_hash: presented } }
    );
  }

  const remaining = await Ticket.count({
    where: { user_id: userId, fingerprint: fp, is_blacklisted: false, expires_at: { [Op.gt]: new Date() } },
  });

  if (remaining === 0) {
    await Session.update(
      { is_revoked: true },
      { where: { user_id: userId, fingerprint: fp } }
    );
  }

  res.clearCookie('hr_ticket', { sameSite: 'none', secure: true, httpOnly: true });

  await auditService.log(userId, 'LOGOUT', { ip: req.ip });
};
