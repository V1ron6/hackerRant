const { Session }         = require('../../models');
const fingerprint         = require('../../utils/fingerprint');
const { unauthorized }    = require('../../utils/response');
const ticketService       = require('../../services/ticket.service');
const authService         = require('../../services/auth.service');

const RENEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

module.exports = async (req, res, next) => {
  try {
    const rawTicket = req.cookies?.hr_ticket;

    if (!rawTicket) {
      return unauthorized(res, 'No ticket provided');
    }

    const fp      = fingerprint(req);
    const matched = await ticketService.findValidTicket(rawTicket, fp);

    if (!matched) {
      return unauthorized(res, 'Invalid or expired ticket');
    }

    if (matched.User.status !== 'active') {
      return unauthorized(res, 'Account suspended or deleted');
    }

    // Update session last_active_at
    await Session.update(
      { last_active_at: new Date() },
      { where: { user_id: matched.user_id, fingerprint: fp, is_revoked: false } }
    );

    req.user        = matched.User;
    req.ticketId    = matched.id;
    req.fingerprint = fp;

    // Tickets last 90 days: inside the final week, swap in a fresh one and
    // blacklist the old (buildi.txt). Same device, so the binding is unchanged.
    if (new Date(matched.expires_at) - Date.now() < RENEW_WINDOW_MS) {
      await authService.issueTicket(req, res, matched.User, 'TICKET_RENEW');
    }

    next();
  } catch (err) {
    next(err);
  }
};
