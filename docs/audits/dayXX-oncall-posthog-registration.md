# Executive Summary

On-call production verification for Profytron Trading OS frontend UI stability and **PostHog registration funnel** measurability (2026-08-03).

Public production routes return HTTP 200. Funnel observability landed in **`02a484f`**, deployed to Cloud Run as **`web-00082-f6j`** (`web:02a484f72…`).

Code changes **close registration funnel gaps** (landing → signup CTA → register → validation → complete → OAuth → email verify → login → dashboard → onboarding) and fix a **post-idle-init first `$pageview` miss**.

| Gate | Result |
|------|--------|
| Commit / push | `02a484f` → `origin/main` |
| Cloud Build | `79dcfc38-e1f3-42c3-a446-bd49d290e6ba` **SUCCESS** |
| Cloud Run | revision `web-00082-f6j` @ 100% traffic, image tag = commit SHA |

**Verdict: PASS WITH OBSERVATIONS**

---

## Production UI Audit

| Flow | Status | Notes |
|------|--------|--------|
| Landing `/` | PASS | HTTP 200 |
| Sign Up `/register` | PASS | HTTP 200; form labels/alerts present |
| Login `/login` | PASS | HTTP 200; URL error messaging + 2FA path |
| OAuth | PASS (code) | Firebase popup / redirect; events added on start + popup completion |
| Email verification `/verify-email` | PASS (code) | OTP + funnel + FIRST_LOGIN |
| Forgot password | PASS | `/forgot-password` HTTP 200 |
| Dashboard entry | PASS (code) | `funnel_dashboard_viewed` once/session |
| Onboarding | PASS (code) | Welcome + risk DNA start/complete |
| Pricing / Community / Help | PASS | HTTP 200 |
| Runtime / blank screens | PASS (static) | No broken public shells observed via HEAD |
| Hydration / console | OBS | Requires device browser; analytics `console.debug` is dev-only |

Authenticated deep dogfood not re-exercised in this run (needs live JWT). No blank public shells from HTTP probes.

---

## Registration Funnel

Measurable stages (canonical event names → PostHog funnel builder):

```text
funnel_landing_viewed          ($pageview path=/)
        ↓
funnel_signup_cta_clicked      (nav / hero / landing CTAs → /register)
        ↓
funnel_register_viewed
        ↓
funnel_register_started        (valid submit → API call)
   (+ funnel_register_validation_failed)
        ↓
signup + funnel_register_completed
        ↓
funnel_email_verified (+ FIRST_LOGIN / funnel_login_success method=email_verify)
        ↓
funnel_login_success           (password / 2FA / oauth)
        ↓
funnel_dashboard_viewed
        ↓
funnel_onboarding_started → funnel_onboarding_completed (+ onboarding_completed)
```

OAuth branch: `funnel_oauth_started` → `funnel_oauth_completed` (+ login success) on Firebase popup path.

---

## PostHog Event Verification

| Event | Trigger | Notes |
|-------|---------|--------|
| `$pageview` | SPA nav + after init | Deduped per URL; captures after late init |
| `funnel_landing_viewed` | First `/` pageview (session once) | Consent required |
| `funnel_signup_cta_clicked` | Primary landing CTAs + PublicNavbar | Props: `href`, `source` |
| `funnel_register_viewed` | Register mount | Session once |
| `funnel_register_started` | Email submit start | |
| `funnel_register_validation_failed` | RHF invalid submit | `fields` prop |
| `signup` | API register success | Activation milestone (kept) |
| `funnel_register_completed` | Same success | Funnel alias; same moment as `signup` |
| `funnel_oauth_started` / `_completed` | social-oauth | Completed on popup complete path |
| `funnel_email_verified` | OTP success | |
| `FIRST_LOGIN` / `funnel_login_success` | Verify / login / 2FA / OAuth | |
| `funnel_dashboard_viewed` | Dashboard mount | Session once |
| `funnel_onboarding_started` | Welcome or Risk mount | Session once shared key |
| `onboarding_completed` / `funnel_onboarding_completed` | Risk DNA finish | |

**Identify:** `useAuthStore.login` → `posthog.identify(user.id, { email, name })`  
**Person profiles:** `identified_only` (events still fire anonymously pre-identify)  
**Consent gate:** init only when `profytron_analytics_consent === granted`  
**Duplicate design:** `signup` + `funnel_register_completed` are intentional pairs (activation vs funnel naming). Session `trackEventOnce` prevents view-stage spam.

---

## Funnel Quality Review

| Concern | Assessment |
|---------|------------|
| Drop-off points | Now stage-visible independently |
| Missing events (pre-fix) | Closed by this PR |
| Duplicate views | Guarded with sessionStorage once keys |
| Sequencing | Matches product route order |
| Anonymous → identified | Identify on login/verify; prior funnel events stay on anonymous distinct_id until alias (PostHog default) |
| Session / reload | Once-keys re-fire only after new session |
| Page reload mid-form | `register_viewed` not re-emitted same session |

**Residual:** Redirect OAuth paths (`/auth/callback`, `/api/auth/google`) may only emit `funnel_oauth_started` (not `_completed`) until a success-side hook is added on callback — accepted non-blocking for popup-primary path.

---

## On-Call Readiness

| Area | Status |
|------|--------|
| Root / dashboard `error.tsx` | Sentry + retry UI |
| Offline banner | Dashboard shell |
| Loading / empty states | Overview CTAs (prior ship) |
| API failure UX | Auth form alerts + sonner |
| Analytics SDK errors | Silent capture try/catch |

---

## Accessibility Audit

Registration/auth (code + prior UX work):

- Floating labels with `useId`, error ids / `aria-describedby` patterns
- Form `role="alert"` / `aria-live` for API errors
- Keyboard-usable submit + password visibility toggles
- OAuth buttons render after mount (SSR shell placeholders)
- `prefers-reduced-motion` on onboarding risk step transitions
- Contrast / full matrix: not re-shot device lab this run — **observation only**

No a11y regression introduced by funnel wiring (no DOM structure changes beyond `onClick` tracking).

---

## Responsive Verification

Logical breakpoints (320–1280): registration uses `min-w-0`, responsive padding, stacked auth visual panel on small screens (prior FE). **Physical multi-viewport matrix not re-shot** this run — mark observation.

Production public shells return 200; overflow issues not found in static review of register layout.

---

## Files Modified

- `apps/web/src/lib/analytics/track.ts` — funnel event catalog + once helpers
- `apps/web/src/components/providers/PostHogProvider.tsx` — post-init pageview + landing funnel
- `apps/web/src/components/home/LandingButtons.tsx` — signup CTA events
- `apps/web/src/components/layout/PublicNavbar.tsx` — nav signup CTA events
- `apps/web/src/app/(public)/register/page.tsx` — view / start / validation / complete
- `apps/web/src/lib/auth/social-oauth.ts` — OAuth start/complete + login
- `apps/web/src/app/(public)/login/LoginPageClient.tsx` — login success
- `apps/web/src/app/(public)/verify-email/page.tsx` — email verified + login
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` — dashboard viewed
- `apps/web/src/app/(public)/onboarding/page.tsx` — onboarding started
- `apps/web/src/app/(public)/onboarding/risk/page.tsx` — start + funnel complete
- `docs/audits/dayXX-oncall-posthog-registration.md` — this report

---

## Tests Executed

| Gate | Result |
|------|--------|
| `npm run lint` | PASS (after PostHogProvider ref lint fix) |
| `npx tsc --noEmit` | PASS |
| `npm test` | N/A — no web unit test script / not used as gate |
| `npm run build` | PASS (Next.js 16.2.2 production build) |

---

## Build Status

**PASS** — optimized production build completed successfully.

---

## Production Monitoring Status

| Check | Status |
|-------|--------|
| Live public UI | Healthy HTTP 200 |
| Image on prod | `web:02a484f72…` revision `web-00082-f6j` |
| PostHog key in Cloud Build | **Empty / not set** in last substitutions (`_NEXT_PUBLIC_POSTHOG_KEY` falsy) — events only fire after key is build-injected |
| Cookie consent | Analytics only after grant |
| Sentry root errors | Present |

**Action required for live funnel metrics:** set `NEXT_PUBLIC_POSTHOG_KEY` (and host) on the next web Cloud Build, then re-verify events in PostHog UI with consent accepted.

---

## Remaining Risks

1. **Consent / empty PostHog key** — funnel is dark if users deny analytics or env key missing.
2. **OAuth redirect completion** not fully instrumented vs popup path.
3. **`signup` + `funnel_register_completed`** double event at same instant — use one in each funnel definition.
4. Authenticated E2E + real PostHog UI verification needs human with consent granted + production key.
5. Local dirty WIP outside this change set must not ship.

---

## Production Readiness

- UI on-call: **ready** (public shells stable; errors recoverable)
- Registration funnel **code-ready** and independently measurable in PostHog after deploy + consent + key
- Quality gates for this change: **pass**

**Verdict:**  
**PASS WITH OBSERVATIONS**

Deploy revision required to activate funnel events in production analytics. **Code is now live** on `web-00082-f6j`; **PostHog project key still missing in build substitutions** until ops supplies it.
