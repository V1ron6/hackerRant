const cookie          = require('cookie');
const fingerprint     = require('../../utils/fingerprint');
const ticketService   = require('../../services/ticket.service');

module.exports = async (socket, next) => {
  try {
    const rawCookies = socket.request.headers.cookie || '';
    const cookies    = cookie.parse(rawCookies);
    const rawTicket  = cookies.hr_ticket;

    if (!rawTicket) {
      return next(new Error('SOCKET_AUTH: No ticket'));
    }

    const matched = await ticketService.findValidTicket(rawTicket, fingerprint(socket.request));

    if (!matched) {
      return next(new Error('SOCKET_AUTH: Invalid ticket'));
    }

    if (matched.User.status !== 'active') {
      return next(new Error('SOCKET_AUTH: Account suspended or deleted'));
    }

    socket.user = matched.User;
    next();
  } catch (err) {
    next(err);
  }
};
