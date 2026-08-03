# PT-A04 — Safari / iOS login + refresh cookie QA

**Date:** 2026-08-02  
**Owner:** aaradhya  
**Status:** In Progress (code hardened; real-device QA still required)

## Background (already in code before Day 13)

Safari/iOS often does not commit the `Set-Cookie: refresh_token` from the login XHR before a same-tick `window.location` hard navigation to a protected route. Edge middleware then redirects to `/login`.

**Mitigation already shipped:**
- Client sets `pf_session_hint=1` synchronously in `login()` via `document.cookie`  
  → [`apps/web/src/lib/stores/useAuthStore.ts`](../../../../apps/web/src/lib/stores/useAuthStore.ts)
- Middleware accepts `refresh_token` **or** `demo_access` **or** `pf_session_hint` as “session present” UX gate only  
  → [`apps/web/src/proxy.ts`](../../../../apps/web/src/proxy.ts)
- Client hydrate still validates the real session against the API

API cookies remain `sameSite: 'lax'` + `secure` when HTTPS  
  → `apps/api/src/modules/auth/auth.controller.ts`

## Day 13 code change

All client-written session-related cookies (`pf_session_hint`, `onboarding_completed`, `user_role`, `demo_access`) now append **`Secure` when `location.protocol === 'https:'`** so production Safari treats them consistently with the API refresh cookie flags.

## Manual Safari QA checklist (still to run on real device or BrowserStack)

Environment: **production** `www.profytron.com` (or staging with HTTPS)

| # | Step | Pass? | Notes |
|---|------|-------|-------|
| 1 | Private window Safari iOS latest | ☐ | |
| 2 | `/register` or `/login` with valid creds | ☐ | |
| 3 | After OTP/login, land on `/dashboard` or `/onboarding` without bounce to login | ☐ | |
| 4 | Hard refresh protected page — still authenticated | ☐ | |
| 5 | Idle 5+ min or background Safari, return, open protected route | ☐ | |
| 6 | Inspect: `refresh_token` present (Application → Cookies) after settle | ☐ | |
| 7 | Inspect: `pf_session_hint=1` immediately post-login | ☐ | |
| 8 | Desktop Safari same path | ☐ | |
| 9 | Logout clears hint + cannot open protected | ☐ | |

## Pass criteria to mark Master Tracker Completed

- [ ] Steps 1–9 pass on Safari iOS **or** recorded BrowserStack session linked here
- [ ] Or bug filed with repro if fail after Secure cookie fix
- [ ] Master Tracker Notes updated with evidence link

## Residual risk

Without a physical iOS device in this environment, Day 13 cannot fully close PT-A04. Code path reviewed; Secure flag is the remaining obvious gap for client cookies on HTTPS.
