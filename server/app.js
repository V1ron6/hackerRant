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
app.use(express.urlencoded({ extended: true }));
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
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
