const rateLimit = require('express-rate-limit');

// 100 requests per minute per IP — applied globally
module.exports = rateLimit({
  windowMs:        60 * 1000,
  max:             100,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'DIANE: Too many requests. Slow down.' },
});
