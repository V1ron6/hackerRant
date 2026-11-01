const crypto = require('crypto');

const TICKET_TTL_DAYS = 90;

// Tickets are 512 bits of CSPRNG output, so a fast SHA-256 is sufficient (no
// offline-guessing risk) and lets us look the ticket up by hash with an index.
// bcrypt here cost ~250 ms of blocked event loop per authenticated request.
const hashTicket = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

exports.hashTicket = hashTicket;

exports.generateTicket = async () => {
  const raw       = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + TICKET_TTL_DAYS * 24 * 60 * 60 * 1000);

  return { raw, hash: hashTicket(raw), expiresAt };
};
