# Deploying hackerRant (Neon + Render + Vercel)

Order matters: the API needs the frontend URL (CORS) and the frontend needs the API URL.

## 0. Prerequisites
- Push this folder to a GitHub repo (Render builds from Git).
- Neon: project `hackerrant` already has the schema (`schema.sql`). Copy the **pooled** connection string for `neondb_owner`.
- Mailjet: verify the sender address you will use as `MAIL_FROM`.
- Cloudflare R2: create a bucket, enable public access (or a custom domain) and make an API token with Object Read & Write. Render's disk is wiped on every deploy, so uploads must not use `STORAGE_DRIVER=local` in production.

## 1. Render (API + Redis) — `render.yaml`
1. Render dashboard → New → Blueprint → pick the repo. It creates `hackerrant-api` and `hackerrant-redis` (Frankfurt, free).
2. Fill the prompted variables: `DATABASE_URL`, `CLIENT_URL` (a temporary value is fine), `PUBLIC_URL` (the service URL, e.g. `https://hackerrant-api.onrender.com`), `MAILJET_*`, `MAIL_FROM`, `R2_*`, `ADMIN_USERNAMES`.
3. After the first deploy, check the logs for `Redis connected`, `Models synced` and the server-running line. Open `<api>/api/health`, which should return `{"ok":true}`.

## 2. Vercel (frontend)
1. New Project → same repo, **Root Directory: `frontend`**. Framework: Vite (build `npm run build`, output `dist`).
2. Environment variable: `VITE_API_URL=https://<api>.onrender.com/api`.
3. Deploy, then copy the production URL.

## 3. Close the loop
- On Render set `CLIENT_URL` to the exact Vercel origin (no trailing slash) and redeploy.
- Browsers that block third-party cookies (Safari, some Firefox/Brave settings) will not keep the login cookie while the site is on `*.vercel.app` and the API on `*.onrender.com`. For production use one custom domain family, e.g. `app.example.com` and `api.example.com`.

## 4. Smoke test
Sign up, receive the Mailjet code, verify, send a message between two accounts, upload an avatar (checks R2), open Settings → location.

## Notes
- Free Render services sleep after inactivity; the first request after a nap is slow and sockets reconnect.
- Free Render Key Value does not persist: a restart clears OTPs, CSRF tokens and queued emails (users just log in again or request a new code).
- `DIANE_MAX` must stay unset in production.
