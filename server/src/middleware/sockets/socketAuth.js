const cookie          = require('cookie');
const { Ticket, User } = require('../../models');
const { verifyTicket } = require('../../utils/ticket');
const fingerprint      = require('../../utils/fingerprint');

module.exports = async (socket, next) => {
  try {
    const rawCookies = socket.request.headers.cookie || '';
    const cookies    = cookie.parse(rawCookies);
    const rawTicket  = cookies.hr_ticket;

    if (!rawTicket) {
      return next(new Error('SOCKET_AUTH: No ticket'));
    }

    const fp = fingerprint(socket.request);

    const tickets = await Ticket.findAll({
      where: { fingerprint: fp, is_blacklisted: false },
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
      return next(new Error('SOCKET_AUTH: Invalid ticket'));
    }

    socket.user = matched.User;
    next();
  } catch (err) {
    next(err);
  }
};
