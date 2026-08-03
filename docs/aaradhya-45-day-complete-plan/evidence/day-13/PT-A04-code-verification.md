# PT-A04 — Safari cookie code verification (automation)

**Date:** 2026-08-02  
**Scope:** Code path review (not physical Safari device video)

## Code controls shipped

| Control | Location | Behavior |
|---------|----------|----------|
| Secure flag on HTTPS for client cookies | `apps/web/src/lib/stores/useAuthStore.ts` → `clientCookieAttrs` | `secure` when `location.protocol === 'https:'` |
| Session hint cookie | `setSessionHintCookie` in same store | Sync `pf_session_hint` before dashboard hop (Safari race fix) |
| Onboarding cookie sync | `syncUserCookies` | `onboarding_completed` + `user_role` with SameSite=Lax |
| Edge proxy gate | `apps/web/src/proxy.ts` | Uses session hint; auth still requires real tokens |
| Social OAuth path | `apps/web/src/lib/auth/social-oauth.ts` | OAuth return flow aligns with session hydrate |

## Automated static checks (this host)

- [x] `clientCookieAttrs` includes `samesite=lax` and conditional `secure`
- [x] `pf_session_hint` set on login / clear on logout (store grep)
- [x] Prod smoke: https://www.profytron.com/login returns 200 (public)

## Still HOLD for sheet “Completed”

Physical Safari/iOS: login → soft-refresh → hard-refresh → cookies screenshot (redact tokens). Template steps remain in `PT-A04-safari-qa.md`.
