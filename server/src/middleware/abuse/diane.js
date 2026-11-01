const rateLimit = require('express-rate-limit');

// 100 requests per minute per IP — applied globally
module.exports = rateLimit({
  windowMs:        60 * 1000,
  max:             Number(process.env.DIANE_MAX) || 100, // override only for load/e2e tests
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'DIANE: Too many requests. Slow down.' },
});
