const crypto = require('crypto');

// Express sets req.ip (honouring `trust proxy`); a raw Socket.io handshake
// request does not. Fall back to the same value Express would derive with
// `trust proxy = 1`: the last X-Forwarded-For entry, else the socket address.
// Without this, socket fingerprints never match the ones issued over HTTP.
const clientIp = (req) => {
  if (req.ip) return req.ip;
  const xff = req.headers?.['x-forwarded-for'];
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket?.remoteAddress || '';
};

module.exports = (req) => {
  const userAgent = req.headers['user-agent']       || '';
  const language  = req.headers['accept-language']  || '';
  // partial IP — first two octets only, avoids dynamic IP mismatches
  const partialIP = clientIp(req).split('.').slice(0, 2).join('.');

  return crypto
    .createHash('sha256')
    .update(userAgent + language + partialIP)
    .digest('hex');
};
