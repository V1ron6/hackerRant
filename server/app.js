const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');

const diane  = require('./src/middleware/abuse/diane');
const routes = require('./src/routes');

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    frameguard:  { action: 'deny' },
    noSniff:  true,
    referrerPolicy:  { policy: 'no-referrer' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc:  ["'none'"],
      },
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// credentials:true required for httpOnly cookies across Vercel <-> Render
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// ─── Body / cookies ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb', parameterLimit: 100 }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Global rate limit ────────────────────────────────────────────────────────
app.use(diane);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  // Keep diagnostic details in server logs; never expose stack traces or internal
  // database/provider messages to clients in production.
  console.error('[api-error]', {
    method: req.method,
    path: req.originalUrl,
    status: err.status || 500,
    message: err.message,
  });

  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600
    ? err.status
    : 500;
  const message = status >= 500
    ? 'Internal server error'
    : (err.publicMessage || err.message || 'Request failed');

  res.status(status).json({ error: message });
});

module.exports = app;
