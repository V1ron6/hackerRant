const rateLimit = require('express-rate-limit');

// Per-user write limiter (posts, threads, replies, uploads, complaints):
// 30 writes per 10 minutes. Must run AFTER authenticate so req.user exists.
module.exports = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  keyGenerator:    (req) => req.user.id,
  message:         { error: 'HAWK: Too many posts. Slow down.' },
});
