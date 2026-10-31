# hackerRant

> Refined Secure Architecture Plan — Production-Ready SERN Stack
awhatapp like web-application
---

## Table of Contents

- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Architecture Overview](#architecture-overview)
- [Phase 1 — Database Design](#phase-1--database-design)
- [Phase 2 — Redis Integration](#phase-2--redis-integration)
- [Phase 3 — Security Utilities](#phase-3--security-utilities)
- [Phase 4 — Security Middleware](#phase-4--security-middleware)
- [Phase 5 — Authentication System](#phase-5--authentication-system)
- [Phase 6 — Socket.io Secure Setup](#phase-6--socketio-secure-setup)
- [Phase 7 — Aggressor (Anti-Bot)](#phase-7--aggressor-anti-bot)
- [Phase 8 — Authorization Layer](#phase-8--authorization-layer)
- [Phase 9 — File Upload Security](#phase-9--file-upload-security)
- [Phase 10 — Queue System](#phase-10--queue-system)
- [Phase 11 — Security Headers](#phase-11--security-headers)
- [Phase 12 — Audit Logging](#phase-12--audit-logging)
- [Phase 13 — Device Management](#phase-13--device-management)
- [Phase 14 — Real-Time Features](#phase-14--real-time-features)
- [Dev Order](#dev-order)
- [Deployment Stack](#deployment-stack)
- [Security Testing Checklist](#security-testing-checklist)

---

## Project Structure

```
hackerrant/
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   │   ├── security/
│   │   │   ├── auth/
│   │   │   ├── abuse/
│   │   │   ├── validation/
│   │   │   └── sockets/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── jobs/
│   │   ├── queues/
│   │   ├── utils/
│   │   └── policies/
│   ├── package.json
│   └── .env
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── layouts/
│   │   └── utils/
│   └── package.json
│
└── README.md
```

---

## Dependencies

### Backend

```bash
npm install express pg pg-hstore sequelize dotenv bcryptjs jsonwebtoken \
  uuid helmet cors express-rate-limit cookie-parser \
  socket.io socket.io-redis redis \
  nodemailer twilio xss validator express-validator \
  morgan winston node-cron bullmq ioredis \
  multer sharp mime-types

npm install @socket.io/redis-adapter

npm install -D nodemon
```

---

## Architecture Overview

```
Client (React) — Vercel
    ↓ HTTPS
Express API + Socket.io — Render
    ↓
Redis — Upstash
    ↓
Postgres — Neon
```

---

## Phase 1 — Database Design

### `users`

```sql
CREATE TABLE users (
  id           CHAR(36) PRIMARY KEY,
  username     VARCHAR(30) UNIQUE NOT NULL,
  first_name   VARCHAR(50),
  last_name    VARCHAR(50),
  email        VARCHAR(100) UNIQUE NOT NULL,
  phone        VARCHAR(20) UNIQUE NOT NULL,
  dob          DATE,
  bio          TEXT,
  avatar_url   VARCHAR(300),

  latitude     DECIMAL(10,8),
  longitude    DECIMAL(11,8),

  status       ENUM('active','suspended','deleted') DEFAULT 'active',

  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `tickets`

```sql
CREATE TABLE tickets (
  id             CHAR(36) PRIMARY KEY,
  user_id        CHAR(36) NOT NULL,

  token_hash     VARCHAR(255) NOT NULL,

  fingerprint    VARCHAR(255) NOT NULL,
  partial_ip     VARCHAR(45),

  expires_at     DATETIME NOT NULL,

  is_blacklisted BOOLEAN DEFAULT FALSE,

  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### `sessions`

```sql
CREATE TABLE sessions (
  id            CHAR(36) PRIMARY KEY,
  user_id       CHAR(36) NOT NULL,

  fingerprint   VARCHAR(255) NOT NULL,

  user_agent    TEXT,
  ip_address    VARCHAR(45),

  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  is_revoked    BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### `audit_logs`

```sql
CREATE TABLE audit_logs (
  id         CHAR(36) PRIMARY KEY,
  user_id    CHAR(36),

  action     VARCHAR(100),
  metadata   JSON,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `otp_store`

```sql
CREATE TABLE otp_store (
  id         CHAR(36) PRIMARY KEY,

  target     VARCHAR(100) NOT NULL,

  otp_hash   VARCHAR(255) NOT NULL,

  purpose    ENUM('register', 'ticket_reset', 'device_link'),

  expires_at DATETIME NOT NULL,

  used       BOOLEAN DEFAULT FALSE
);
```

---

## Phase 2 — Redis Integration

### Responsibilities

| Role | Description |
|---|---|
| Session cache | Fast session lookups |
| Socket.io pub/sub | Scalable real-time messaging |
| Online presence | Track connected users |
| OTP storage | Temporary, expiring OTP store |
| Queue system | Background job management |
| Rate limiting | Per-IP / per-user throttling |
| Aggressor cache | Anti-bot verification state |

### Config

```js
// config/redis.js
const Redis = require('ioredis');

module.exports = new Redis(process.env.REDIS_URL);
```

---

## Phase 3 — Security Utilities

### Ticket Utility

```js
// utils/ticket.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.generateTicket = async () => {
  const raw = crypto.randomBytes(64).toString('hex');
  const hash = await bcrypt.hash(raw, 12);
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  return { raw, hash, expiresAt };
};

exports.verifyTicket = async (raw, hash) => {
  return bcrypt.compare(raw, hash);
};
```

### Device Fingerprint

```js
// utils/fingerprint.js
const crypto = require('crypto');

module.exports = (req) => {
  const userAgent  = req.headers['user-agent'] || '';
  const language   = req.headers['accept-language'] || '';
  const partialIP  = req.ip.split('.').slice(0, 2).join('.');

  return crypto
    .createHash('sha256')
    .update(userAgent + language + partialIP)
    .digest('hex');
};
```

---

## Phase 4 — Security Middleware

Named after the Seven Deadly Sins.

### 1. Diane — Global API Shield

```js
// middleware/abuse/diane.js
const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'DIANE: Too many requests.' }
});
```

### 2. Meliodas — Login Protection

```js
// middleware/abuse/meliodas.js
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});
```

### 3. King — XSS Protection

> **Important:** Store raw content. Sanitize only on render/output.

```js
// middleware/security/king.js
const xss = require('xss');

module.exports = (content) => {
  return xss(content);
};
```

### 4. Ban — Validation Layer

```js
// middleware/validation/ban.js
const { validationResult } = require('express-validator');

module.exports = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
};
```

### 5. Gowther — Session Anomaly Detector

```js
// middleware/auth/gowther.js
const fingerprint = require('../../utils/fingerprint');

module.exports = async (req, res, next) => {
  const currentFingerprint = fingerprint(req);

  if (req.session.fingerprint !== currentFingerprint) {
    await revokeSession(req.session.id);

    return res.status(401).json({ error: 'GOWTHER: Session anomaly' });
  }

  next();
};
```

### 6. Escanor — Ticket Abuse Guard

```js
// middleware/abuse/escanor.js
module.exports = async (userId, action, db) => {
  const count = await db.TicketChangeLog.count({
    where: { user_id: userId }
  });

  if (count >= 2) {
    await db.User.update(
      { status: 'suspended' },
      { where: { id: userId } }
    );

    throw new Error('ESCANOR: Too many ticket resets');
  }
};
```

---

## Phase 5 — Authentication System

> **Breaking changes from previous design:**
> - ❌ Removed `localStorage` ticket storage
> - ❌ Removed raw ticket exposure to frontend JS
> - ❌ Removed exact IP matching

### Flow

1. User registers
2. OTP verification
3. Server creates ticket
4. Ticket stored **only** as secure `httpOnly` cookie
5. Cookie auto-authenticates all requests
6. Socket.io reads cookie server-side

### Secure Cookie

```js
res.cookie('hr_ticket', rawTicket, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 90 * 24 * 60 * 60 * 1000
});
```

---

## Phase 6 — Socket.io Secure Setup

### Redis Adapter

```js
// sockets/index.js
const { createAdapter } = require('@socket.io/redis-adapter');

io.adapter(createAdapter(pubClient, subClient));
```

### Secure Socket Auth

```js
io.use(async (socket, next) => {
  const cookie = socket.request.headers.cookie;

  // parse hr_ticket
  const session = await validateTicket(cookie);

  if (!session) {
    return next(new Error('INVALID'));
  }

  socket.user = session.user;
  next();
});
```

---

## Phase 7 — Aggressor (Anti-Bot)

> **Important:** No global synchronized verification — each socket runs its own random interval.

```js
io.on('connection', (socket) => {
  const interval = randomBetween(4, 7) * 60 * 1000;

  socket.aggressor = setInterval(() => {
    socket.emit('aggressor:verify');
  }, interval);

  socket.on('disconnect', () => {
    clearInterval(socket.aggressor);
  });
});
```

---

## Phase 8 — Authorization Layer

```
policies/
├── message.policy.js
├── thread.policy.js
├── profile.policy.js
└── admin.policy.js
```

### Example

```js
// policies/message.policy.js
module.exports.canDeleteMessage = (user, message) => {
  return user.id === message.sender_id;
};
```

---

## Phase 9 — File Upload Security

| Rule | Status |
|---|---|
| Image whitelist | ✅ |
| MIME validation | ✅ |
| Size limits | ✅ |
| Virus scan pipeline | ✅ |
| Image compression | ✅ |
| Cloud storage only | ✅ |

### Multer Setup

```js
const multer = require('multer');

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }
});
```

---

## Phase 10 — Queue System

BullMQ handles all async jobs:

- OTP delivery
- Email sending
- SMS sending
- Notifications
- Ticket renewal

### Queue Setup

```js
// queues/email.queue.js
const { Queue } = require('bullmq');

module.exports = new Queue('email');
```

---

## Phase 11 — Security Headers

```js
app.use(
  helmet({
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        objectSrc: ["'none'"]
      }
    }
  })
);
```

---

## Phase 12 — Audit Logging

Track the following events:

- Ticket resets
- Login attempts
- Suspicious activity
- Moderation actions
- Session revocations
- OTP failures

---

## Phase 13 — Device Management

Users can:

- View all active devices
- Revoke individual sessions
- Revoke all sessions at once
- Monitor login history

---

## Phase 14 — Real-Time Features

| Feature | Status |
|---|---|
| Live messaging | ✅ |
| Typing indicators | ✅ |
| Read receipts | ✅ |
| Online presence | ✅ |
| Statuses | ✅ |
| Threads | ✅ |
| Rant finder | ✅ |

---

## Dev Order

1. Sequelize + DB setup
2. Redis integration
3. User / Ticket / Session models
4. Auth services
5. Cookie-only ticket auth
6. Security middleware
7. Authorization policies
8. Socket.io secure setup
9. Chat engine
10. Queue system
11. File upload pipeline
12. Frontend pages
13. Device management
14. Audit logging
15. Security audit / testing
16. Deployment

---

## Deployment Stack

| Layer | Service |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon (Postgres) |
| Redis | Upstash |
| Storage | Cloudflare R2 / AWS S3 |

---

## Security Testing Checklist

- [ ] SQLMap test
- [ ] XSS payload test
- [ ] CSRF test
- [ ] Socket auth bypass test
- [ ] Rate limit test
- [ ] Session hijack simulation
- [ ] Upload exploit test
- [ ] Header inspection
- [ ] JWT / ticket replay test
- [ ] OWASP ZAP scan
