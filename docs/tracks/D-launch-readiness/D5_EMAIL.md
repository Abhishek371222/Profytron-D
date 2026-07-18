# D5 — Production Email & OTP UAT

## Goal

Resend delivers OTP / verify / reset to a real inbox (not spam-silent).

## Prerequisites

- `RESEND_API_KEY` live  
- Domain `profytron.com` (or configured from) verified in Resend  
- SPF/DKIM/DMARC OK  

## Opt-in product-audit

```bash
ALLOW_LIVE_EMAIL_OTP=1 pnpm product-audit:journeys
```

## Manual UAT script

| # | Step | Pass | Evidence |
| ---: | --- | --- | --- |
| 1 | Register new beta email | OTP email arrives < 2 min | inbox screenshot |
| 2 | Verify email | Account verified | |
| 3 | Forgot password | Reset OTP/link works | |
| 4 | Spam check | Landed in inbox (or documented spam) | |
| 5 | Mock path off | `EXPOSE_DEV_OTP` not relied on in prod | |

## Evidence template

`evidence/D5_EMAIL_<YYYYMMDD>.md`

## Exit

⬜ Inbox proof attached · V1 gate 5 email/OTP flip
