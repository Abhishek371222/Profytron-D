# Profytron RC-1 — Deployment Checklist

**Audience:** Staging then production  
**Related:** [RC1_RELEASE_NOTES.md](./RC1_RELEASE_NOTES.md) · [RC1_SMOKE_TEST.md](./RC1_SMOKE_TEST.md)

---

## Before Deployment

### Code & release

- [ ] RC-1 commit present on deploy branch
- [ ] Working tree clean (no accidental secrets)
- [ ] Image/tag for **rollback** recorded
- [ ] Owner / on-call named for deploy window

### Environment & secrets

- [ ] `NODE_ENV=production` or `staging`
- [ ] `DATABASE_URL` (TLS Postgres/Neon)
- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (strong, unique)
- [ ] `JWT_ACCESS_EXPIRES` optional (default **15m** in prod/staging if unset)
- [ ] `JWT_REFRESH_EXPIRES` set deliberately
- [ ] Broker credential encryption key / AES secret as used by the API
- [ ] `REDIS_URL` as `rediss://…:6379` (not bare REST-only URL without conversion confidence)
- [ ] `CORS_ORIGIN` and `FRONTEND_URL` exact allowlist
- [ ] `COOKIE_SECURE=true` behind HTTPS
- [ ] `RESEND_API_KEY` for real mail
- [ ] Stripe: live or **test** keys matching environment; `STRIPE_WEBHOOK_SECRET`
- [ ] Razorpay: live/test pair; webhook secret; **not** `DEMO_KEY` on staging if testing real gateways
- [ ] `METAAPI_TOKEN` if live trading expected
- [ ] Optional: `READY_REQUIRE_REDIS=true`
- [ ] Optional: Sentry DSNs (API + web)

### Forbidden in staging/prod (unless deliberate)

- [ ] No `EXPOSE_DEV_OTP=true`
- [ ] No `REDIS_INMEMORY=true` (multi-instance)
- [ ] No `ALLOW_MOCK_EMAIL=true` if real mail required
- [ ] No casual `ALLOW_LEDGER_ONLY_REFUNDS=true`
- [ ] No production `prisma db seed` with demo passwords

### Integrations

- [ ] Stripe webhook endpoint → `POST /v1/webhooks/stripe`
- [ ] Events include: `payment_intent.succeeded`, invoice paid, subscription lifecycle, `charge.refunded`
- [ ] Razorpay webhooks pointed at live API and signature verified
- [ ] Migrations applied if any pending outside RC-1

### Capacity

- [ ] Plan **single API instance** first (process-local throttling)

---

## Deployment

- [ ] Apply database migrations if needed
- [ ] Deploy API
- [ ] Deploy web
- [ ] Confirm process starts (env validation does not `process.exit` on invalid config)
- [ ] Confirm no mock payment keys if real money path is enabled

---

## After Deployment

- [ ] `GET /live` → ok
- [ ] `GET /ready` → ok (DB/Redis as configured)
- [ ] `GET /health` as used by load balancer
- [ ] `GET /metrics` returns scrape output (or APM attached)
- [ ] One synthetic login + refresh + logout
- [ ] Sentry (if configured) receives a test event or heartbeat
- [ ] Logs show structured JSON (prod) without secret material

---

## First Hour Monitoring

- [ ] HTTP 5xx rate
- [ ] Auth 401 / 503 spikes (Redis/session)
- [ ] Webhook 2xx / signature failures
- [ ] Bull `trade_execution` lag / failures
- [ ] Wallet deposit confirmations vs Stripe dashboard
- [ ] Email FAILED rate (missing Resend)
- [ ] MetaAPI errors if trading enabled
- [ ] Refund errors if exercised

---

## First Day

- [ ] Sample wallet reconciliation vs gateways
- [ ] Sample renewal invoices → no unexpected wallet OUT
- [ ] Trading: single fill per signal (no duplicate tickets)
- [ ] Admin audit trail for sensitive actions
- [ ] Decide: expand beta / hold / rollback

---

## Rollback

- [ ] Redeploy previous image/tag
- [ ] Re-point webhooks only if URL changed
- [ ] Verify `/ready` and login
- [ ] Confirm wallets not mid-flight (pause large payments if needed)
- [ ] Write incident / change note

---

## Production Config Reference (do not invent new keys)

| Concern | Typical vars / endpoints |
|---------|---------------------------|
| JWT | `JWT_ACCESS_*`, `JWT_REFRESH_*` |
| Redis | `REDIS_URL`, optional Upstash REST for converters |
| Database | `DATABASE_URL` |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, webhook secret |
| MetaAPI | `METAAPI_TOKEN`, master account env as already used |
| Email | `RESEND_API_KEY` |
| CORS | `CORS_ORIGIN`, `FRONTEND_URL` |
| Health | `/live`, `/ready`, `/health` |
| Metrics | `/metrics` |
| Flags | Existing feature-flag guard only |
| Cookies | `COOKIE_SECURE` |
