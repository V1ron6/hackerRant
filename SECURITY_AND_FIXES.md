# Fixes and security notes

## Frontend
- Corrected API base URL handling to support both `VITE_API_URL` and the existing `VITE_API_BASE_URL` name, with a local-development fallback.
- Added safe network-error handling, no-store requests, and URL encoding for usernames/session IDs.
- Replaced duplicate/conflicting global font declarations and invalid color values with a consistent responsive baseline, visible keyboard focus, and reduced-motion support.
- Fixed the favicon path and added basic page metadata.
- Added Vercel security response headers and SPA routing.
- Removed the machine-specific `.env` file from the project archive and added `.env.example`. Set `VITE_API_URL` in deployment settings to the real API base URL.

## Backend
- Limited URL-encoded request bodies and parameter counts.
- Changed the global error handler to log diagnostics on the server while returning generic messages for server-side failures.

## Important deployment checks
- The frontend is untrusted: authorization and input validation must remain enforced by the backend.
- Keep authentication in secure, HttpOnly cookies; do not move session tickets into localStorage.
- Configure `CLIENT_URL`, cookie settings/secrets, database/Redis credentials, and the frontend API URL in the hosting provider's environment settings. Never commit real credentials.
- Review the Content Security Policy in `frontend/vercel.json` against the actual production API and any required third-party resources before deploying.
- A full production build could not be confirmed in this environment because dependency installation did not complete and `vite/client` was unavailable. Run `npm ci` then `npm run build` in `frontend/` in a normal network-enabled environment before deployment.

---

# Update: completed pages, Mailjet, Neon, responsive pass

## Setup
- Database is **Neon Postgres**: set `DATABASE_URL` (SSL is on unless `DB_SSL=false`). On a fresh database `sequelize.sync` creates every table. If you already have a `users` table, add the new column: `ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;`
- Email is **Mailjet** (Send API v3.1): `MAILJET_API_KEY`, `MAILJET_API_SECRET`, `MAIL_FROM` (a sender verified in Mailjet), `MAIL_FROM_NAME`. Emails go through a BullMQ queue; set `RUN_EMAIL_WORKER=true` to run the worker inside the API process, or run `npm run worker` separately.
- Uploads: `STORAGE_DRIVER=local` (dev) or `r2` with the `R2_*` variables; set `PUBLIC_URL` to the API's public origin.
- Everything is listed in `server/.env.example`.

## Frontend
- New pages: Profile, public profile (`/app/u/:username`), Settings, Status, Threads + thread detail, RantFinder, Ranres, Complains, and a public Recover page (`/recover`).
- Chat themes, notification toggle and location sharing are wired through `SettingsContext`.
- Signup: lowercases username/email, resend-code with cooldown, and resumes verification for unverified accounts from the login page.
- Responsive: every route checked at 1280, 768 and 375 px (no horizontal scroll); chat uses `dvh` so the message box stays on screen on phones; the floating verifier badge shrinks to a dot on small screens.
- Logged-out visitors no longer fire a `/auth/me` probe (a `localStorage` hint is set on login), which removed the 401 errors from every public page load.

## Backend
- Tickets are stored as SHA-256 hashes and looked up directly (the bcrypt loop blocked the event loop).
- CSRF token is returned in `/auth/me`, reused while valid (tabs no longer invalidate each other) and the client retries once on expiry.
- Fixed: socket fingerprint mismatch behind a proxy, `timingSafeEqual` length crash (500), verify-otp crash on unknown email, unique-constraint 500s, login before email verification.
- Privacy: location is opt-in on both sides, rounded to about 1 km, never returned (only a coarse distance), and erased when sharing is turned off. Account deletion scrubs personal data.
- `DIANE_MAX` env var overrides the global 100/min/IP limit; it exists for load tests only, leave it unset in production.

## Known limits
- Browsers that block third-party cookies break login when the frontend (Vercel) and API (Render) are on different registrable domains; use one custom domain for both in production.
- Cloudflare R2 was tested against a fake S3 server, not the real service.
- Status posts older than 24 h are hidden but not deleted.
- Not deployed: nothing has been created on Vercel or Render yet.
