# Trimly API (backend)

Node.js + Express 5 · MongoDB · Redis · BullMQ · emails via **Brevo**.

```bash
npm install
cp .env.example .env     # set MONGODB_URI, REDIS_URL and both JWT secrets
npm run dev              # http://localhost:5000   ·   Swagger UI: /api/docs
```

Requires Node ≥ 20.19, MongoDB and Redis.
Generate secrets: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Sending email with Brevo

OTP, password-reset and welcome emails are sent through Brevo's transactional email API
(`POST https://api.brevo.com/v3/smtp/email`) from a background BullMQ worker, with 3 automatic retries.

1. Create a free account at https://www.brevo.com
2. **API key:** top-right menu → *SMTP & API* → *API Keys* → *Generate a new API key*. Copy it (starts with `xkeysib-`).
3. **Sender:** *Senders, Domains & Dedicated IPs* → add and verify the email address (or domain) you will send from.
   Brevo rejects emails from unverified senders.
4. Put them in `.env`:

```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxx
MAIL_FROM_EMAIL=you@yourdomain.com     # the verified sender
MAIL_FROM_NAME=Trimly
```

**Development without Brevo:** leave `BREVO_API_KEY` empty. Nothing is sent; the code is printed in the API terminal:
`[mail disabled] To: you@gmail.com | Verify your email | OTP: 482913`

**Production:** `NODE_ENV=production` refuses to start without `BREVO_API_KEY`.
Failures from Brevo such as 401/400 (wrong key, unverified sender, invalid address) are logged and not retried;
429 and 5xx responses are retried with exponential backoff. Check the API logs for `Brevo API responded …`.
Free-plan limit: about 300 emails/day.

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `MONGODB_URI` | required | |
| `REDIS_URL` | `redis://127.0.0.1:6379` | |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | required | ≥ 32 random chars (enforced in production) |
| `BASE_URL` | `http://localhost:5000` | Public API URL; short links are `BASE_URL/r/<code>` |
| `CLIENT_URL` | `http://localhost:5173` | CORS allow-list, comma separated |
| `PORT` / `TRUST_PROXY` | `5000` / `0` | `TRUST_PROXY=1` behind Nginx/Render/Heroku |
| `JWT_ACCESS_EXPIRES_MINUTES` / `JWT_REFRESH_EXPIRES_DAYS` / `OTP_TTL_SECONDS` | `15` / `7` / `600` | |
| `COOKIE_SAME_SITE` / `COOKIE_SECURE` / `COOKIE_DOMAIN` | `lax` / `false` / – | Cross-site deploy → `none` (HTTPS) |
| `BREVO_API_KEY` | empty | Empty = log OTPs only (development) |
| `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME` | empty / `Trimly` | Sender must be verified in Brevo |
| `SENTRY_DSN` | empty | Optional |
| `RUN_WORKERS_IN_API` | `true` | `false` + `npm run worker` for a separate worker process |
| `SWAGGER_ENABLED` | `true` | |

## Scripts

`npm run dev` · `npm start` · `npm run worker` · `npm run lint` · `npm test` · `npm run test:e2e` (needs MongoDB + Redis)

## API

Swagger UI at `/api/docs`, spec in `docs/openapi.yaml`. What was fixed in the original code: `docs/BACKEND_REVIEW.md`.
