const crypto = require('crypto');

module.exports = (req) => {
  const userAgent = req.headers['user-agent']       || '';
  const language  = req.headers['accept-language']  || '';
  // partial IP — first two octets only, avoids dynamic IP mismatches
  const partialIP = (req.ip || '').split('.').slice(0, 2).join('.');

  return crypto
    .createHash('sha256')
    .update(userAgent + language + partialIP)
    .digest('hex');
};
