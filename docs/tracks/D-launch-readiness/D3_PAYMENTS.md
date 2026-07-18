# D3 — Payment Gateway UAT

## Goal

Live (or provider **test mode**) checkout + webhook → entitlement granted.

## Prerequisites

- Stripe and/or Razorpay keys in secrets (not `DEMO_KEY`)  
- Webhook endpoints registered to staging/prod API  
- `STRIPE_WEBHOOK_SECRET` / `RAZORPAY_WEBHOOK_SECRET` set  

## Opt-in product-audit

```bash
ALLOW_LIVE_PAYMENT=1 pnpm product-audit:journeys
```

## Manual UAT script

| # | Step | Pass | Evidence |
| ---: | --- | --- | --- |
| 1 | Open billing / upgrade | Page loads | |
| 2 | Start checkout (Stripe or Razorpay) | Provider UI opens | |
| 3 | Complete test payment | Success redirect | txn id |
| 4 | Webhook received | 2xx in provider dashboard + API logs | |
| 5 | Entitlement | Plan/subscription active in app | screenshot |
| 6 | Failed payment | Clear error; no false entitlement | |

## Evidence template

`evidence/D3_PAYMENTS_<YYYYMMDD>.md` — date, provider, txn ids, pass/fail.

## Exit

⬜ At least one provider fully validated · V1 gate 5 payments line flip
