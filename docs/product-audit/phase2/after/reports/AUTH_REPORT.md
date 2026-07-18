# Auth Report

**Journey:** Authentication surfaces (`auth`)  
**Wall time:** 39346 ms  
**Steps:** 8

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| register | /register | Complete | 7380 | 1 | journeys/auth/register.png |  |
| login | /login | Complete | 6399 | 1 | journeys/auth/login.png |  |
| forgot | /forgot-password | Complete | 5667 | 1 | journeys/auth/forgot.png |  |
| reset | /reset-password | Complete | 5331 | 1 | journeys/auth/reset.png |  |
| verify | /verify-email | Complete | 6026 | 1 | journeys/auth/verify.png |  |
| oauth_buttons | /login | Complete | 4276 | 1 | journeys/auth/oauth_buttons.png | UI presence only — no live OAuth |
| logout | /dashboard | Partial | 4240 | 1 | journeys/auth/logout.png | Page reachable; expect "log out\|logout\|sign out" soft-matched via body |
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
