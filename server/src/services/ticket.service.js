const { Ticket, User } = require('../models');
const { hashTicket }   = require('../utils/ticket');
const auditService     = require('./audit.service');

// Resolve a raw ticket + device fingerprint to a live ticket (with its user), or null.
// Soft IP binding: if the network prefix changed but the device (browser/OS) still
// matches, the ticket stays valid, the stored prefix is updated and the move is
// audit-logged. A different device class never matches.
exports.findValidTicket = async (rawTicket, fingerprint, partialIp) => {
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

  if (partialIp && ticket.partial_ip !== partialIp) {
    const from = ticket.partial_ip;
    await Ticket.update({ partial_ip: partialIp }, { where: { id: ticket.id } });
    ticket.partial_ip = partialIp;
    await auditService.log(ticket.user_id, 'IP_CHANGE', { from, to: partialIp });
  }

  return ticket;
};
