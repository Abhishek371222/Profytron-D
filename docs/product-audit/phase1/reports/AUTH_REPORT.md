# Auth Report

**Journey:** Authentication surfaces (`auth`)  
**Wall time:** 34636 ms  
**Steps:** 7

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| register | /register | Complete | 7363 | 1 | journeys/auth/register.png |  |
| login | /login | Complete | 5761 | 1 | journeys/auth/login.png |  |
| forgot | /forgot-password | Complete | 5969 | 1 | journeys/auth/forgot.png |  |
| reset | /reset-password | Complete | 5954 | 1 | journeys/auth/reset.png |  |
| verify | /verify-email | Complete | 5644 | 1 | journeys/auth/verify.png |  |
| oauth_buttons | /login | Complete | 3919 | 1 | journeys/auth/oauth_buttons.png | UI presence only — no live OAuth |
| live_otp | /register | Blocked | 0 | 0 | — | Live email OTP not exercised |

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |


## Policy skips

Live email OTP and live OAuth handshakes are **Blocked/Partial** by design — UI reachability only.
