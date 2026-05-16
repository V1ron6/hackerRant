const { Ticket, User, Session } = require('../../models');
const { verifyTicket }          = require('../../utils/ticket');
const fingerprint               = require('../../utils/fingerprint');
const { unauthorized }          = require('../../utils/response');

module.exports = async (req, res, next) => {
  try {
    const rawTicket = req.cookies?.hr_ticket;

    if (!rawTicket) {
      return unauthorized(res, 'No ticket provided');
    }

    // Find a valid, non-blacklisted ticket by fingerprint
    const fp = fingerprint(req);

    const tickets = await Ticket.findAll({
      where: {
        fingerprint:    fp,
        is_blacklisted: false,
      },
      include: [{ model: User, attributes: { exclude: ['password_hash'] } }],
    });

    let matched = null;

    for (const ticket of tickets) {
      const valid = await verifyTicket(rawTicket, ticket.token_hash);
      if (valid && new Date(ticket.expires_at) > new Date()) {
        matched = ticket;
        break;
      }
    }

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

    req.user      = matched.User;
    req.ticketId  = matched.id;
    req.fingerprint = fp;

    next();
  } catch (err) {
    next(err);
  }
};
