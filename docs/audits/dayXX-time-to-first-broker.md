# Executive Summary

Time-to-First-Broker (TTFBroker) analytics verification and gap closure for Profytron Trading OS (2026-08-03).

**Finding:** Core PT-K03 instrumentation **already existed** (`markActivationStart` → successful broker connect → `time_to_first_broker` + `time_to_first_broker_seconds`). Gaps were identified that under-counted real activation:

1. OAuth success paths never called `markActivationStart` (clock never started for social sign-in).
2. Dashboard “demo paper” banner connect bypassed client broker analytics.
3. Dedicated `time_to_first_broker` could re-fire in a later session if `sessionStorage` was cleared and login remounted the clock (lifetime once-guard missing).

**Implementation:** Smallest safe additions only—shared helper, OAuth clock + funnel events, demo-banner parity, localStorage once-guard. **Did not** introduce a new SDK, rename events, or break existing funnels.

**Verdict: PASS WITH OBSERVATIONS**

---

## Existing Analytics Audit

| Area | Location | Status |
|------|----------|--------|
| PostHog client | `PostHogProvider` + `window.posthog.capture` | Present |
| Event wrapper | `lib/analytics/track.ts` `trackEvent` | Present |
| Activation (server + client) | `trackActivation` + growth API | Present |
| Registration funnel | `REGISTRATION_FUNNEL_EVENTS` | Present (prior on-call ship) |
| T0 clock | `markActivationStart` / `getTimeToFirstBrokerSeconds` | Present (sessionStorage) |
| Primary connect UI | `BrokerConnectModal` | Present |

---

## Broker Events Reviewed

| Event | Where | Notes |
|-------|-------|-------|
| `funnel_*` registration/login/dashboard | Register, login, landing, OAuth | Prior funnel |
| `signup` / `ACTIVATION_EVENTS.SIGNUP` | Register | Present |
| `markActivationStart` | Register, verify-email, password login, **OAuth (new)** | Session T0 |
| `broker_connect_started` | Modal + **demo banner (new)** | Props: `mode`, optional `source` |
| `broker_connect_failed` | Modal + **demo banner (new)** | |
| `broker_connected` | Modal via helper; **demo via helper** | + optional seconds prop |
| `time_to_first_broker` | On success when T0 present, **once** via `pf_ttfb_fired` | Props: `seconds`, `mode`, optional `source` |
| `broker_connected` (lower) activation | Client `BROKER_CONNECTED` + server BFF `trackActivation` | Durable first-connect record |
| Disconnect / reconnect client product events | Disconnect API only; no separate product disconnect event required for TTFB | Out of TTFB scope |

---

## Time-to-First-Broker Implementation

### Definition (unchanged name)

```text
markActivationStart()   // registration / first auth session clock
        ↓
first successful client broker connect (paper or live)
        ↓
time_to_first_broker { seconds, mode, source? }
```

+ property `time_to_first_broker_seconds` on `broker_connected` / activation payload when T0 is present.

### Changes this pass

| Change | Why |
|--------|-----|
| `recordBrokerConnectSuccessAnalytics()` | Single success emission path (no drift) |
| OAuth popup (`social-oauth`) + redirect / code-exchange callback | Start T0 + funnel parity |
| Demo banner paper connect | Same events as modal path |
| `localStorage` `pf_ttfb_fired` | Emit dedicated TTFB event at most once per browser |

Historical event **names** preserved.

---

## Event Verification

| Check | Result |
|-------|--------|
| Primary modal fires started / success / fail / TTFB | Yes |
| Dedicated TTFB only when T0 exists | Yes |
| Lifetime once for TTFB event | Yes (localStorage) |
| No new analytics provider | Yes |
| User still identified via existing PostHog identity | Yes (unchanged) |
| Invisible to UX | Analytics-only; no UI copy/layout change except zero |

---

## Funnel Verification

Measurable activation chain:

```text
Landing / funnel_landing_viewed
  → Signup CTA / Register / OAuth
  → signup + funnel_register_completed (email)
  → funnel_login_success / OAuth (marks T0)
  → funnel_dashboard_viewed
  → broker_connect_started
  → broker_connected + time_to_first_broker (first with clock)
```

Ordering respects existing registration funnel names. Consent-gated PostHog still no-ops if key empty (prior observation).

---

## Performance Impact

| Concern | Assessment |
|---------|------------|
| Bundle | Shared function + localStorage; no new dependencies |
| Broker path latency | Fire-and-forget `trackEvent` / async `trackActivation` after success toast path |
| Hydration | Client-only sessionStorage/localStorage; no SSR touch |
| Re-renders | No React state for analytics |

---

## Files Modified

- `apps/web/src/lib/analytics/track.ts`
- `apps/web/src/components/copy-trading/BrokerConnectModal.tsx`
- `apps/web/src/lib/auth/social-oauth.ts`
- `apps/web/src/app/(public)/auth/callback/AuthCallbackClient.tsx`
- `apps/web/src/app/(dashboard)/DashboardLayoutClient.tsx`
- `docs/audits/dayXX-time-to-first-broker.md` (this file)

---

## Tests Executed

| Command | Result |
|---------|--------|
| `npm run lint` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |
| `npm run test` | Not configured for frontend |

---

## Build Status

Recorded green in engineering report at ship time.

---

## Remaining Risks

1. **PostHog key** may be empty in some env/deploy substitutions → client no-ops until key set.  
2. **T0 is sessionStorage** — full new browser/device after signup without re-auth re-mark may lack T0 until next login/register (login still remounts).  
3. **Server-only** durable `BROKER_CONNECTED` already existed for warehouse; client TTFB requires JS + consent.  
4. Users who connected brokers before `pf_ttfb_fired` will get one TTFB if T0 present on next connect after deploy (once-guard is new).

---

## Production Readiness

TTFBroker is measurable via existing event names and now covers OAuth + demo-paper paths without duplicating SDKs or renaming historical events.

**Verdict: PASS WITH OBSERVATIONS**
