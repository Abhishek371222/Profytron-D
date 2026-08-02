# Profytron RC-1 — Smoke Test Checklist

**When:** After staging deploy, before inviting beta users  
**Environment:** Sandbox gateways preferred  
**Related:** [RC1_RELEASE_NOTES.md](./RC1_RELEASE_NOTES.md)

Mark each item pass / fail. Any fail on money or auth is a **hold**.

---

## Authentication

- [ ] Register new account
- [ ] Email verification (if enabled) delivers real or sandbox mail
- [ ] Login success
- [ ] Login failure lockout behaviour under wrong password
- [ ] Access token works on a protected route
- [ ] Refresh issues new access token
- [ ] Logout: refresh token no longer works
- [ ] Profile / me response does **not** include `twoFactorSecret` or backup codes
- [ ] 2FA enable + login with TOTP (if tested)
- [ ] Password reset end-to-end

## Wallet

- [ ] Create Stripe (or Razorpay) deposit
- [ ] Webhook confirms deposit → balance correct
- [ ] Deposit appears as CONFIRMED transaction
- [ ] Withdrawal initiate (or admin path) as applicable
- [ ] Balance does not go incorrectly negative from renewals

## Payments / Billing

- [ ] Platform subscription purchase
- [ ] Plan upgrade
- [ ] Plan downgrade
- [ ] Invoice appears in Billing Center
- [ ] Invoice PDF download
- [ ] Payment result UX for success / failure pages

## Marketplace

- [ ] Marketplace listing purchase / subscribe
- [ ] Subscription ACTIVE in account
- [ ] **Renewal simulation** (or test invoice webhook): buyer wallet not wrongly debited
- [ ] Creator credit / sales path as expected for model

## Refunds

- [ ] Admin refund with valid gateway payment → refunds at Stripe/Razorpay
- [ ] Admin refund when gateway fails → **error**, no silent ledger-only success
- [ ] User notified / payment status updated as designed

## Trading

- [ ] Paper or sandbox master signal → follower execution
- [ ] Single open trade for signal (no duplicate MetaAPI opens on retry)
- [ ] Failed MetaAPI path records FAILED execution (if forced)
- [ ] Queue job retry does not double-open when trade already OPEN

## AI Coach

- [ ] Coach chat responds
- [ ] Rate limit still applies under burst (not unlimited)
- [ ] Failure path returns controlled error (no hang)

## Admin

- [ ] Admin login (strong password provisioned)
- [ ] Audit log list
- [ ] Payments list
- [ ] Platform subscriptions list / force cancel
- [ ] No open admin routes without auth (spot-check)

## Notifications

- [ ] In-app list loads
- [ ] Limit param capped (e.g. limit=999 returns at most 100)
- [ ] Mark read works
- [ ] Billing / trading notification example if triggered

## Health & Ops

- [ ] `GET /live` 200
- [ ] `GET /ready` 200 when dependencies up
- [ ] `GET /ready` degraded/503 when Redis required and down (if flag on)
- [ ] `GET /metrics` returns text counters
- [ ] Error response includes request id when forced 4xx/5xx
- [ ] CORS rejects unknown origin (browser preflight or curl with Origin)

## Security Spots

- [ ] No secrets in HTML/JS bundles for server-only keys
- [ ] `EXPOSE_DEV_OTP` not true on environment
- [ ] Logs do not print full payment card / tokens

---

## Sign-off

| Role | Name | Date | Result |
|------|------|------|--------|
| Deployer | | | |
| Reviewer | | | |

**Staging smoke result:** PASS / FAIL  
**Proceed to beta:** YES / NO
