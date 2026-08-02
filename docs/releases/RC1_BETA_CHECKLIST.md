# Profytron RC-1 — Beta Checklist

**When:** Limited cohort after staging smoke passes  
**Related:** [RC1_RELEASE_NOTES.md](./RC1_RELEASE_NOTES.md) · [RC1_DEPLOYMENT_CHECKLIST.md](./RC1_DEPLOYMENT_CHECKLIST.md)

---

## Beta Scope

- [ ] Define cohort size and invite list
- [ ] Sandbox vs small real-money policy documented
- [ ] Single API instance (until distributed rate limits)
- [ ] On-call covers first 24–72 hours
- [ ] Rollback image known

---

## Authentication

Monitor:

- [ ] Login failure rate
- [ ] 503 SESSION / refresh failures (Redis)
- [ ] Unexpected mass logout / blacklist storms
- [ ] 2FA enable failures
- [ ] Password reset delivery failures

Alerts if: Redis errors > threshold; spike in `INVALID_REFRESH_SESSION` / `SERVICE_UNAVAILABLE` auth.

---

## Money (Wallet · Billing · Marketplace)

Monitor:

- [ ] Deposit confirms lag vs Stripe/Razorpay dashboard
- [ ] Double credits (same payment intent idempotency collision)
- [ ] Marketplace renewals creating unexpected wallet OUT
- [ ] Platform subscription activates without double wallet credit
- [ ] Invoice generation failures
- [ ] Refund gateway failures vs ledger mismatches
- [ ] Creator payout / credit anomalies
- [ ] Withdrawal queue failures marked FAILED + user notified

Alerts if: balance mismatches in spot recon; webhook error rate; refund 4xx/5xx surge.

---

## Trading

Monitor:

- [ ] Execution FAILED rate
- [ ] Duplicate OPEN trades same signalId / brokerTicket
- [ ] Queue retry storms
- [ ] MetaAPI disconnects / token errors
- [ ] Master sync lag

Alerts if: duplicate tickets; MetaAPI 401/429 sustained; queue DLQ growth.

---

## Marketplace

Monitor:

- [ ] Purchase failures at gateway
- [ ] Subscription stuck PENDING/ACTIVE mismatch
- [ ] Cancel vs renewal race (invoice after cancel)

---

## MetaAPI

Monitor:

- [ ] Account deploy / connect errors
- [ ] ExecuteTrade errors
- [ ] Region mismatch issues
- [ ] Token expiry / invalid token

---

## Queues

Monitor:

- [ ] `trade_execution` waiting / active / failed
- [ ] Withdrawal queue failures
- [ ] Repeated job retries same payload

---

## Redis

Monitor:

- [ ] Connection errors / reconnect loops
- [ ] Session set/get latency
- [ ] Memory / eviction if applicable

Impact: auth fail-closed when security-critical ops fail.

---

## Email

Monitor:

- [ ] Resend API error rate
- [ ] EmailLog status FAILED without key
- [ ] OTP/password email latency

---

## Monitoring & Alerts

- [ ] Sentry issues triaged daily in beta
- [ ] `/metrics` or APM dashboards checked
- [ ] Structured logs searchable by request/correlation id
- [ ] Webhook provider retry dashboards

Suggested alert themes:

| Signal | Severity |
|--------|----------|
| 5xx rate spike | High |
| Webhook signature failures | High |
| Auth SERVICE_UNAVAILABLE cluster | High |
| Wallet double-credit suspicion | Critical |
| Queue fail + backlog | High |
| MetaAPI token invalid | High |
| Email all FAILED | Medium |

---

## Exit Criteria (promote or hold)

Promote toward broader production only if:

- [ ] Smoke checklist green on staging
- [ ] No open P0 in beta logs
- [ ] Money recon samples clean for cohort period
- [ ] No uncontrolled duplicate trades
- [ ] On-call comfortable with runbook + rollback

Hold / rollback if:

- [ ] Wallet integrity incident
- [ ] Auth system-wide outage from misconfig
- [ ] Uncontrolled live trade doubles
- [ ] Gateway refund / deposit systematic failure

---

## Daily beta standup (suggested)

1. Errors last 24h by code  
2. Money events last 24h (deposit/withdraw/refund/renewal)  
3. Trading opens vs MetaAPI  
4. Top support tickets  
5. Go/No-go keep beta open
