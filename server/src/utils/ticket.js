const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');

const TICKET_TTL_DAYS = 90;

exports.generateTicket = async () => {
  const raw      = crypto.randomBytes(64).toString('hex');
  const hash     = await bcrypt.hash(raw, 12);
  const expiresAt = new Date(Date.now() + TICKET_TTL_DAYS * 24 * 60 * 60 * 1000);

  return { raw, hash, expiresAt };
};

exports.verifyTicket = async (raw, hash) => {
  return bcrypt.compare(raw, hash);
};
