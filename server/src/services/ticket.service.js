const { Ticket, User } = require('../models');
const { hashTicket }   = require('../utils/ticket');

// Resolve a raw ticket + device fingerprint to a live ticket (with its user), or null.
exports.findValidTicket = async (rawTicket, fingerprint) => {
  if (typeof rawTicket !== 'string' || !rawTicket) return null;

  const ticket = await Ticket.findOne({
    where: {
      token_hash:     hashTicket(rawTicket),
      fingerprint,
      is_blacklisted: false,
    },
    include: [{ model: User, attributes: { exclude: ['password_hash'] } }],
  });

  if (!ticket || new Date(ticket.expires_at) <= new Date()) return null;
  return ticket;
};
