# Backend review: what was found and what was changed

The original backend was read file by file. Many parts could not have run as uploaded (wrong env names, missing
`"type": "module"`, broken imports), and the core feature — **click analytics** — was not implemented. This document
lists the problems and how each was fixed. Everything below is covered by the unit tests and by
`npm run test:e2e` (33 checks against real MongoDB + Redis).

## 1. Things that stopped the app from running

| Problem | Fix |
|---|---|
| `package.json` had no `"type": "module"`, but all code uses `import` | Added it, plus `engines`, `start`, `dev`, `worker`, `lint`, `test` scripts |
| `env.js` required `MongoDB_URL`, `REDIS_URL`, `SMTP_FROM`, `SENTRY_DSN`; `.env.example` and the code used different names (`MONGODB_URI`, `ACCESS_TOKEN_SECRET` vs `JWT_ACCESS_SECRET`) | One validated source of truth (`envalid`), `.env.example` matches it. Sentry and SMTP are optional in development |
| `ApiError` stored `statuscode` but the error middleware read `statusCode` → **every error became a 500** | Fixed; middleware also maps JSON-parse, duplicate-key (409), CastError (400), body-too-large (413) |
| URL model was exported as `URL` (shadowing the global) and its fields (`shortUrl`, `expiryAt`) did not match what services/repositories used (`shortCode`, `expiresAt`) | Single consistent schema: `shortCode`, `expiresAt`, `clicks`, `lastClickedAt` |
| `Click.click(...)` in the click repository (not a Mongoose method) | `Click.create` |
| Email worker was never started, imported a non-existent path, and used a queue/job name that did not match the producer | Workers start with the API (or standalone via `npm run worker`); names unified |
| `jwt` and `logger` used without being imported in the auth service | Imported / removed |
| Mongo ids looked up with `findOne({ id })` (never matches) in auth middleware and profile | `findById` |
| Two `POST /` routes for URLs (list was registered as POST), `/:id` could shadow named routes | List is `GET /urls`; `/urls/summary` is declared before `/:id` |
| i18n locale folder named `h1` instead of `hi`; rate-limit messages lived in a namespace that was never loaded | Fixed; all messages in one `translation.json` per language |

## 2. Security issues

| Problem | Fix |
|---|---|
| OTP generator `Math.floor(1000000 + Math.random())` always returned **1000000** | `crypto.randomInt(100000, 1000000)` |
| OTPs stored in plain text, unlimited guesses | Stored as HMAC, max 5 attempts, 60 s resend cooldown, constant-time compare |
| Signup duplicate check was inverted (`!emailExist`) and returned an `ApiError` instead of throwing it | Correct check, thrown |
| Access/refresh tokens were written to the log on login | Removed; logger also redacts `Authorization` and cookies |
| `expireIn` typo in `jwt.sign` → tokens never expired | `expiresIn` |
| Refresh tokens stored raw, reusable, 15-day expiry vs 7-day cookie | Stored as SHA-256 hash, **single-use rotation**, reuse revokes all sessions, TTL index auto-deletes |
| `updateProfile` passed `req.body` straight to Mongo (mass assignment: `isVerified`, `password`, …) | Only `username` is accepted |
| Separate error messages for "user not found" / "wrong password" and timing differences | Generic `invalid_credentials`, dummy bcrypt compare for unknown emails |
| `forgot-password` revealed which emails exist | Always the same response |
| Search used a raw user-supplied regex (ReDoS / injection) | Escaped |
| Cookies hard-coded `secure` + `sameSite: strict` (broke local dev and cross-site deploys) | Configurable (`COOKIE_SAME_SITE`, `COOKIE_SECURE`, `COOKIE_DOMAIN`); refresh cookie scoped to `/api/v1/auth` |
| Password-change validator expected `currentPassword`, service read `oldPassword`; delete-account passed args in the wrong shape | Aligned; password change signs out other devices and re-issues this session |
| Delete account left links, clicks and cache behind | Deletes everything the user owns |
| Redirect cache outlived link expiry and kept the old destination after edits | Cache TTL ≤ time-to-expiry, expiry re-checked on hit, cache invalidated on update/delete |
| Shortening a link that points back to this service (redirect loops) | Rejected |
| `trust proxy` hard-coded to 1 (lets clients spoof IPs when not behind a proxy) | `TRUST_PROXY` env, default 0 |

## 3. Features that were missing

- **Click tracking + analytics** (the headline feature): redirect enqueues a BullMQ job; a worker stores the click and
  increments the counter. `GET /urls/:id/analytics` returns daily series, browsers, OS, devices, countries,
  referrers, unique visitors and recent clicks; `GET /urls/summary` powers the dashboard.
  Bots are ignored, raw IPs are never stored (keyed hash only), country comes from CDN headers.
- Custom aliases (with a reserved-word list), optional expiry (`410 Gone`), clearing expiry with `null`.
- Search, status filter, sorting and pagination on the list endpoint.
- `/health` (MongoDB + Redis), graceful shutdown, 404 handler, optional Sentry.
- **OpenAPI 3 spec + Swagger UI** at `/api/docs` (validated in the test suite).
- ESLint config, unit tests, end-to-end smoke test, Dockerfile, CI workflow.

## 4. Known limitations (deliberate, documented)

- Country detection needs a CDN/proxy header (Cloudflare, Vercel, CloudFront). No GeoIP database is bundled.
- If the click worker crashes between inserting the click and incrementing the counter, a retry may count one click
  twice. MongoDB multi-document transactions would fix it but require a replica set.
- Email address can't be changed (it would need a second OTP flow).
- Deactivated accounts can only be re-enabled directly in the database.
