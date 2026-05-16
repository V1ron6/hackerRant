const rateLimit = require('express-rate-limit');

// 10 login attempts per 15 minutes per IP
module.exports = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'MELIODAS: Too many login attempts.' },
});
