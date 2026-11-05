const rateLimit = require('express-rate-limit');

// 10 failed attempts per 15 minutes per IP. Successful requests don't count, so
// legitimate logins/OTP verifications (and your own testing) can't lock you out.
module.exports = rateLimit({
  windowMs:               15 * 60 * 1000,
  max:                    Number(process.env.MELIODAS_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders:        true,
  legacyHeaders:          false,
  message:                { error: 'MELIODAS: Too many login attempts.' },
});
