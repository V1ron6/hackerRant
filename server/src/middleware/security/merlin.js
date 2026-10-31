const crypto = require('crypto');
const redis  = require('../../config/redis');

const TOKEN_TTL = 60 * 60; // 1 hour in seconds

// ─── Generate a CSRF token tied to the user's session ────────────────────────
exports.generateToken = async (req, res, next) => {
  try {
    const sessionId = req.user?.id;

    if (!sessionId) return next();

    const token = crypto.randomBytes(32).toString('hex');

    // Store in Redis keyed by user ID
    await redis.set(`csrf:${sessionId}`, token, 'EX', TOKEN_TTL);

    // The cookie is set by the API origin, so JS on a different frontend
    // origin (Vercel) cannot read it. Expose the token to the handler too.
    res.locals.csrfToken = token;

    // Send token in a readable (non-httpOnly) cookie so the client JS can read it
    res.cookie('hr_csrf', token, {
      httpOnly: false,
      secure:   true,
      sameSite: 'none',
      maxAge:   TOKEN_TTL * 1000,
    });

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Validate CSRF token on state-mutating requests ──────────────────────────
exports.verifyToken = async (req, res, next) => {
  try {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    const sessionId    = req.user?.id;
    const clientToken  = req.headers['x-csrf-token'] || req.body?._csrf;

    if (!sessionId || !clientToken) {
      return res.status(403).json({ error: 'MERLIN: CSRF token missing' });
    }

    const storedToken = await redis.get(`csrf:${sessionId}`);

    if (!storedToken) {
      return res.status(403).json({ error: 'MERLIN: CSRF token expired' });
    }

    const valid = crypto.timingSafeEqual(
      Buffer.from(clientToken),
      Buffer.from(storedToken)
    );

    if (!valid) {
      return res.status(403).json({ error: 'MERLIN: Invalid CSRF token' });
    }

    next();
  } catch (err) {
    next(err);
  }
};
