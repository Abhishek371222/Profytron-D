# Executive Summary

Frontend **load stability & RUM verification** for Profytron Trading OS (2026-08-03).  
Gate type: **operations / observability** only — no new features, redesigns, or extra monitoring platforms.

**Frontend remained stable under expected load. No implementation changes were required. Existing RUM instrumentation was verified (or its absence documented if not implemented).**

| Gate | Result |
|------|--------|
| Prod shell load (sequential + concurrent) | **Healthy** HTTP 200; TTFBs roughly 200–500 ms |
| Reproducible FE P0/P1 under load | **0** |
| RUM stack present | **Sentry** (errors/traces/replay-on-error) + **PostHog** (pageviews/identity/web_vital events, consent-gated) + **Next `useReportWebVitals`** |
| New monitoring platform | **None** added |
| App code / commit / redeploy | **None** |

**Verdict: PASS WITH OBSERVATIONS**

---

## Evidence Reviewed

| Source | Signal used |
|--------|-------------|
| `docs/audits/dayXX-dashboard-performance-final.md` | Lazy widgets, viewport gating, idle strip — load architecture |
| `docs/audits/dayXX-oncall-posthog-registration.md` | Funnel + PostHog consent/key ops notes |
| `docs/audits/dayXX-frontend-final-closeout.md` / P1 / zero-backlog | Prior FE closeouts; no open FE backlog |
| Cloud Run logs (`web`, 2d) | Severity ERROR + httpRequest status ≥500 |
| Cloud Run service describe | Image/revision alignment |
| Code: `instrumentation*.ts`, `WebVitalsProvider`, `PostHogProvider`, `error.tsx`, `global-error.tsx`, `layout.tsx` | RUM wiring |
| Prod HTTP smoke | Public & SPA shells |
| Local quality gates | lint / tsc / build |

**No beta session recordings or live PostHog UI export available to agent.** Authenticated browser DevTools dogfood not executed (no JWT).

### Categorization of findings

| ID | Severity | Finding | Action |
|----|----------|---------|--------|
| L1 | — | Public route shells return 200 under sequential + 10× concurrent dashboard hit | No FE fix |
| L2 | **P2 ops** | Cloud Run ERROR: `EACCES mkdir '/app/apps/web/.next/cache'` (read-only `USER node` image) | Document; pages still serve 200 — **not** treated as user-visible P0/P1 crash |
| L3 | **P0/P1 backend** (not FE) | Historical 500/504 on `/api/strategies/my`, `/api/analytics/portfolio` (long latency ~2–5 min) | Backend/proxy timeouts; **out of FE fix scope this gate** |
| L4 | Observability | PostHog requires consent + build-time `NEXT_PUBLIC_POSTHOG_KEY`; prior on-call noted empty key risk | Ops observation only |
| L5 | — | No React “Hydration failed” / `__next_error__` strings in landing HTML | No FE hydration fix |

**Verified implementable FE P0/P1 under load: 0 → no implementation justified.**

---

## Load Verification

### Production environment

| Item | Value |
|------|--------|
| Service | Cloud Run `web` (asia-south1) |
| Revision | `web-00099-hmk` @ **100%** |
| Image | `web:1a8de071b2f7280be5330b10cebfaadc2585c6e1` |
| Local / origin | `1a8de071…` (matched) |

### Scenario matrix (production-equivalent, agent scope)

| Scenario | Method | Result |
|----------|--------|--------|
| Initial landing load | GET `/` | **200** ~475 ms, body ~45 KB |
| Auth shell | GET `/login` | **200** ~246 ms |
| Dashboard shell | GET `/dashboard` | **200** ~248 ms (SPA shell; auth client-side) |
| Dashboard concurrent burst | 10 parallel GET `/dashboard` | **10/10 OK** ~436–488 ms |
| Analytics / Marketplace / Bot Plans / Coach / Notifications / Settings / Help | GET shells | **200** all |
| Multi-widget / modal / command palette / charts | Source audit only | Dynamic chart + order modal, idle scene, RQ `refetchInterval` bounded — no infinite loop patterns found |
| Auth form HTML | Static probe | SPA shell (client forms) — no blank 5xx |
| Runtime exceptions in SSR HTML | Pattern scan | No hydration-failed / next_error strings |
| Memory leaks / infinite render | Not instrumented in headless HTTP | Code-level: no evidence of runaway intervals on dashboard core queries (`refetchInterval: false` or long polls) |

### Load conclusions

- Frontend edge remains responsive under modest concurrent shell pressure.  
- No reproable FE crash loop from probes.  
- Authenticated widget hydrate / chart paint / modal open remain **outside** this HTTP-only load probe (observation).

---

## RUM Audit

### Stack (already implemented — no new platform)

| Layer | Implementation | Captures |
|-------|----------------|----------|
| **Sentry (client)** | `instrumentation-client.ts` idle-deferred `@sentry/nextjs` when `NEXT_PUBLIC_SENTRY_DSN` set | JS errors, traces (`tracesSampleRate` 0.1), **replay on error** (session rate 0), route transition hook `onRouterTransitionStart` |
| **Sentry (server/edge)** | `instrumentation.ts` + `onRequestError` | Request errors; traces 0.05 edge / 0.1 node |
| **Sentry (React)** | `app/error.tsx`, `app/global-error.tsx` → `captureException` | Boundary-caught React errors |
| **CSP / replay** | `next.config.ts` allows Sentry ingest + blob workers for replay | Prior CSP ship |
| **Web Vitals → PostHog** | `WebVitalsProvider` + `useReportWebVitals` (prod only) | Metrics via Next: **LCP, INP, CLS, FCP, TTFB** (as reported) → event `web_vital` with `name`, `value`, `rating`, `navigationType`, `path` |
| **Optional beacon** | `NEXT_PUBLIC_VITALS_ENDPOINT` | sendBeacon/fetch dual-path if set |
| **PostHog product analytics** | `PostHogProvider` + `track.ts` | `$pageview` (SPA, de-duped), identify/reset on auth, custom/funnel events; **consent-gated** |
| **Session / UA** | Sentry + PostHog defaults | User-agent / session context via vendors (Sentry strips IP; email stripped server-side) |

### Coverage checklist

| Signal | Status |
|--------|--------|
| JavaScript errors | **Sentry** (when DSN configured) |
| Unhandled promise rejections | **Sentry** SDK default (client init present) |
| Page load timings / CWV | **Next web-vitals → PostHog `web_vital`** (+ optional custom endpoint) |
| Route transitions | Sentry `captureRouterTransitionStart`; PostHog SPA `$pageview` |
| INP / LCP / CLS | Via `useReportWebVitals` metric names |
| User agent | Vendor defaults |
| Session identification | Sentry session; PostHog `person_profiles: identified_only` after `identify` |
| Page views | PostHog `$pageview` after consent |

### Correctness notes

1. Sentry **defers** until idle/load — protects landing critical path; early errors before boot may be under-captured (trade-off).  
2. PostHog init is **consent + key + idle** — no analytics without grant; empty key ⇒ silent no-op (prior on-call observation).  
3. Landing HTML includes posthog-related strings (consent/copy and/or bundle); Sentry not inline in first HTML (lazy import) — expected.  
4. **No second RUM/monitoring vendor added.**

`NEXT_PUBLIC_VITALS_ENDPOINT` is optional and typically unset — CWV still go to PostHog when client ready.

---

## Frontend Errors Reviewed

| Class | Result |
|-------|--------|
| React SSR blank / 5xx shells | Not observed on sampled prod routes |
| Hydration error strings in HTML | **None** |
| Error boundaries present | `error.tsx`, `global-error.tsx`, dashboard error |
| Suspense / dynamic load patterns | Dashboard dynamic + idle remain intact |
| Network retry storms | Core dashboard intervals constrained; admin/admin agents only poll faster when intentionally batching |
| Console noise | Not browser-probed; no FE crash commits pending |
| Cloud Run `EACCES` next cache | **Noise ERROR logs**; **not** mapped to user 5xx on static shell tests |

**Frontend errors fixed this gate: none (none verified P0/P1 FE).**

---

## Performance Sanity Check

| Check | Result |
|-------|--------|
| Bundle regression / new deps | **None** (no code change) |
| Blocking new third-party SDK on critical path | Sentry/PostHog remain deferred/consent |
| Lazy loading (dashboard chart / order modal / scene) | **Intact** (`dynamic` + idle) |
| Build | **PASS** (no measurable regression vs prior closeout builds) |
| Speculative optimisations | **None** applied |

---

## Accessibility Verification

No load/error UI code changed → **no a11y regressions introduced by this gate**.

Prior focus-visible / reduced-motion / status roles remain the baseline (unchanged).

---

## Files Modified

| Scope | Change |
|-------|--------|
| Application FE | **None** |
| This audit | `docs/audits/dayXX-load-rum-verification.md` (local; **not committed** — Phase 9) |

---

## Tests Executed

| Command | Result |
|---------|--------|
| `npm run lint` | **PASS** |
| `npx tsc --noEmit` | **PASS** (`TSC_OK`) |
| `npm run build` | **PASS** (`BUILD_EXIT=0`) |
| `npm run test` | **Not configured** for frontend |

> `npm run test` is not configured for the frontend; lint, typecheck, and production build completed successfully.

Additional: production sequential route smokes; 10× concurrent `/dashboard` shell smokes; Cloud Logging ERROR + 5xx sample (2 days).

---

## Build Status

**PASS** — zero ESLint errors, zero TypeScript errors, successful production next build.

---

## Remaining Risks

1. **Authed** multi-widget CWV / INP not measured without browser + JWT.  
2. **PostHog dark funnel** if key missing or consent denied — ops must confirm key in build subs / PostHog project.  
3. **Sentry idle boot** can miss first-millisecond exceptions.  
4. **`EACCES` .next/cache** log noise on Cloud Run — candidate for Docker `writable /tmp`/cache dir (**ops P2**, not done this gate).  
5. Historical **backend proxy timeouts** can still surface empty/error dashboard cards under load — backend capacity, not FE load defect.  
6. Live Sentry/PostHog dashboard export not queried by agent (no org token in session).

---

## Production Readiness

Production FE image matches `main` (`1a8de071…` · `web-00099-hmk`).  
Frontend remains stable under expected shell load. RUM stack is **present and correctly wired** for errors and CWV (with consent/key caveats). **No implementation, commit, or redeploy required.**

---

## Verdict

**PASS WITH OBSERVATIONS**

**Frontend remained stable under expected load. No implementation changes were required. Existing RUM instrumentation was verified (or its absence documented if not implemented).**
