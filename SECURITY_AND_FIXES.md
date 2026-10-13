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
