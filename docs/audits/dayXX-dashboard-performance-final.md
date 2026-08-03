# Executive Summary

Final **Dashboard-only** frontend performance audit for Profytron Trading OS (2026-08-03). Reviewed production patterns, prior Lighthouse/mobile baselines, and overview architecture (`useDashboardModel`, dynamic chart slot, idle secondary chrome, viewport modules).

Dashboard already had a strong performance skeleton (RQ stale/refetch discipline, cache hydrate, dynamic performance chart, deferred checklist/tutorials, IO-gated WebGL). **Meaningful client optimizations remaining without architecture/backend changes:** rare-path order modal code-splitting, idle-deferred ambient scene strip, and consistent below-fold viewport gating for calendar/news on the legacy render path.

**Verdict: PASS WITH OBSERVATIONS**

---

## Performance Baseline

### Prior measurements (repo history)

| Source | Scope | Key lab metrics |
|--------|-------|-----------------|
| Day-13 / `web-00074` LH (landing) | Public mobile | Median **LCP 3.93s** target for landing |
| `dayXX-final-seo-lighthouse-mobile` | Landing | Medians Perf ~54, LCP ~9.2s (regressed then defer re-ship), **CLS 0** |
| `dayXX-dashboard-mobile-final` | Dashboard UX | Dynamic `OverviewPerformance`; idle bottom-nav reduced motion; no numeric CWV for auth dashboard |

### This gate (Dashboard)

| Signal | Result |
|--------|--------|
| Prod `/dashboard` | HTTP **307** (auth redirect) — full authed CWV not lab-captured without JWT |
| Architecture audit | Production-oriented data layer already in place (see Network Review) |
| Bundle/tooling | `@next/bundle-analyzer` present as dep; no ANALYZE bake this pass |
| First paint competition | Measured code risk: eager `ManualOrderModal` + ambient strip before metrics |

**Authed Dashboard FCP/LCP/INP lab scores:** not captured (session credentials absent). Baseline for this audit is **source architecture + prior ships**, not a new PostHog session profile.

---

## Render Audit

| Finding | Evidence | Action |
|---------|----------|--------|
| Secondary chrome deferred | `DashboardLayoutClient` `requestIdleCallback` → checklist/tutorials | Already optimal |
| Metrics/PnL memoized | `useMemo` sparklines/unrealized | Keep |
| Stable callbacks | `useCallback` for order/tabs | Keep |
| Motion/experience engines | Dynamic import on flag | Keep |
| Order modal eager | Static import of trading modal on overview route | **Dynamic `ssr:false`** |
| Ambient WebGL strip above fold | Synchronous `DashboardSceneStrip` at top of tree | **Idle + dynamic** load |
| Calendar/News | Viewport-gated only when `engineOn`; legacy always mounted | **Always `ViewportModule`** |
| Dual module trees (engine + legacy) | Both imported; flag at runtime | Accept as runtime rollback path; splitting is larger architecture work |

No hot-path use of forbidden memo cascades; no backend changes.

---

## Bundle Analysis

| Dependency | Dashboard relation |
|------------|-------------------|
| Performance chart | Already `dynamic(..., ssr:false)` |
| Manual order (`useTradeActions` + dialog) | **Was** eager → **code-split** |
| Scene strip / SceneSlot | WebGL IO-gated already; package load timed after idle |
| recharts | Via equity chart dynamic path |
| framer-motion | Used in banners/checklist (defer shell) |
| Spline / SceneManager | Idle scene manager + strip defer |

Other large package removals require architecture (shared AppShell, monorepo splitting).

---

## Network Review

`platform/dashboard/useDashboardModel.ts`:

- L2 **cache hydrate** before network when session ready  
- Portfolio / open trades / risk: long stale, **no** aggressive refetchInterval  
- Trade history: 30s stale; 5s poll only while `syncPending`  
- Realtime WS via `useDashboardRealtime`  
- Parallel account-bound queries under React Query  

News/calendar still fetch from parent (data prep while mount deferred) — acceptable, no API contract change.

---

## Widget Performance

| Widget | Strategy |
|--------|----------|
| Metrics / positions | Critical path; skeletons while loading |
| Performance chart | Dynamic |
| Market watch | In-grid |
| Recent trades | In-grid |
| Calendar / news | **ViewportModule** offscreen pause |
| Risk / quick actions | Bottom row |
| Ambient strip | Idle placeholder min-height → strip |
| Order modal | Dynamic chunk on demand |

---

## Accessibility Verification

| Check | Result |
|-------|--------|
| Ambient placeholder | `aria-hidden` + min-height reserves layout (**CLS-safe**) |
| Scene label | Unchanged when strip mounts |
| Focus / keyboard | No change to interactive widgets |
| Loading skeletons | Unchanged for metrics/tables |
| Empty/error recovery | Unchanged from mobile pass |

---

## Performance Improvements Applied

1. **`ManualOrderModal`** → `next/dynamic` (`ssr: false`) so overview JS does not include trading form until used.  
2. **`DashboardSceneStrip`** → dynamic import + **idle** mount (placeholder preserves 9rem height).  
3. **Calendar & News** always wrapped in **`ViewportModule`** (legacy path parity).

---

## Before vs After Metrics

| Metric | Before | After |
|--------|--------|-------|
| Overview route eager imports | Modal + ambient strip modules | Dynamic chunks |
| Below-fold news/calendar (engine off) | Immediate mount | Viewport-gated |
| Ambient vs metrics TBT competition | Strip at mount | Strip post-idle (≤2.5s timeout) |
| Lab Lighthouse auth dashboard | N/A | N/A (no JWT lab) |
| Production build | — | PASS after changes |

Improvements are **qualitative/architectural metrics** (chunk split, deferred work). Numeric LCP delta for authed overview not published without lab JWT run.

---

## Files Modified

- `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- `docs/audits/dayXX-dashboard-performance-final.md` (this file)

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

| Item | Value |
|------|--------|
| Commit | `ce5a81fcebf059b2a60dbdbd84a6d18cee4ade47` |
| Push | `origin/main` |
| Cloud Build | `d7ee191e-be4d-498a-9071-8411abdd622c` SUCCESS |

---

## Remaining Risks

1. **Authed Dashboard Lighthouse** still not run with production JWT — residual CWV blind spot.  
2. **Engine + legacy dual imports** still in one page module graph — further split would be architectural.  
3. News/calendar **network** still schedules on overview even if widgets off-screen (data, not mount).  
4. Landing **LCP** history is separate surface (prior SEO audit).  
5. Scene Manager still boots dashboard-wide when experience engine on (idle) — not disabled.

---

## Production Readiness

Dashboard frontend performance has no further **obvious low-risk FE wins** beyond this defer/split pass without architectural/backend work.  
Ship deferral + dynamic imports when quality gates pass; redeploy web for production effect.

**Verdict: PASS WITH OBSERVATIONS**
