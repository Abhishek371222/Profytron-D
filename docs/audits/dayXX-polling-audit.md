# Executive Summary

Frontend **polling audit & reduction** for Profytron Trading OS (2026-08-03).

Inventory covered all TanStack Query `refetchInterval` sites, custom `setInterval` network pollers, and UI-only intervals. No SWR. Trading/Broker sockets already used for equity deltas (not replaced).

**Evidence-backed reductions applied** mainly: honor `allowFallback: false` on dashboard market quotes (was still REST-polling every 18s), pause intervals when the tab is hidden, and soften non-critical news/bot sync cadences. Business-critical MetaAPI sync-pending (5s) and Market Watch session schedulers retained.

**Verdict: PASS WITH OBSERVATIONS**

---

## Polling Inventory

### Product (user-facing)

| Mechanism | Endpoint(s) / action | Interval (before → after where changed) | Surfaces | Business need |
|-----------|----------------------|----------------------------------------|----------|---------------|
| RQ `useAccountContext` | `brokerApi.getBrokerAccounts` | 60s; **pause when hidden** (already) | Dashboard shell, account switcher | Account health / paper vs live |
| RQ live quotes `useLiveMarketFeed` | `/api/market/quotes` (+ missing per-symbol) | **18s always → seed 15s then 30s (fallback) / 120s (dashboard `allowFallback:false`)**; stop when hidden; socket probe **5s→10s** (no network) | Dashboard OverviewMarketWatch | Price cards; dashboard must not dual-chatty with REST |
| RQ dashboard core portfolio/open/risk | analytics/trading/risk APIs | **`false`** (socket/mt5 reconcile) | Dashboard | Prefer realtime + 5m medium reconcile |
| RQ trade history overview | trade history | 5s if `syncPending`, else 60s; **+pause hidden** | Dashboard recent trades | MetaAPI catch-up |
| `setInterval` bg reconcile | invalidate open-trades/portfolio/history/accounts | **5 min**, skip if hidden (already) | Dashboard | Soft reconcile |
| RQ news (dashboard) | market news | **120s → 5 min**; pause hidden | Dashboard below-fold | Non-trading critical |
| RQ economic calendar | calendar | 10 min; **+pause hidden** | Dashboard | Session planning |
| RQ history page | closed trades export path | 60s; **+pause hidden** | History | Moderate freshness |
| setInterval my-bots | `POST /trading/sync-bots` + invalidate | **30s → 60s**; skip when hidden (already) | My Bots | Bot status reconcile |
| RQ markets quotes | `marketApi.getQuotes` | session.quotePollMs (10–120s by session); **+pause hidden** | Market Watch | Live board |
| RQ markets OHLC | OHLC frames | session.ohlcPollMs; **+pause hidden** | Market Watch | Candle board |
| RQ markets bias | getBias | session.biasPollMs; **+pause hidden** | Market Watch | Bias panel |
| RQ markets news | news | 2m open / 5m closed; **+pause hidden** | Market Watch | News rail |
| RQ analytics/* | portfolio/risk/etc | staleTime only; **no interval** | Analytics family | On-demand |
| RQ marketplace / bot plans | catalog | staleTime only | Marketplace / Bot Plans | On-demand |
| RQ notifications | — | **no interval** | Notifications | Mutation/invalidate driven |
| Alpha Coach | sockets + coach context staleTimes | No fixed REST poll for chat stream | Coach | Socket-led |
| Public status | health refresh | 30s; **+skip when hidden** | `/status` | Ops status page |
| UI clocks / timers | local `Date` | 1s / 15s | LiveClock, markets “now”, verify OTP | Not network |

### Admin (operator-only)

| Surface | Interval | After |
|---------|----------|-------|
| Admin home KPIs / payments / brokers | 30s | **+pause hidden** |
| Admin growth | 60s | **+pause hidden** |
| Admin system metrics/health | 15s | **+pause hidden** |
| Admin agents | 3s batch / 10–15s idle | **+pause hidden**; batch rate kept |
| Admin KYC / strategies | 30s | **+pause hidden** |

### Non-network intervals (left unchanged)

RotatingWords, LiveClock, ExecutiveWaitBar, SceneAnalyticsPanel, motion profiler/engine, verify-email countdown, tutorial target finder, experience-dev panel — UI only.

### Explicitly not redesigning

- WebSocket/SSE paths for trading / coach / account snapshot remain.
- Socket.io `transports: ['websocket','polling']` is transport fallback, not product RQ poll.

---

## Network Analysis

Method: code inventory + prior load/RUM audits (HTTP shell probes). Full authed DevTools session not available without JWT; conclusions from source of truth (poll intervals).

| Finding | Evidence | Severity |
|---------|----------|----------|
| Dashboard market feed ignored `allowFallback: false` | modules pass `allowFallback: false`; interval always 18s | **High (fixed)** |
| Interval polls without visibility pause | dashboard news/calendar, history, markets bias/news, some admin | **Medium (fixed)** |
| My Bots POST every 30s while on page | setInterval 30_000 even idle bots | **Medium (slowed to 60s)** |
| Trade history 5s during MetaAPI sync | intentional | Keep |
| Market Watch 10s quotes in session | intentional trading freshness | Keep |
| Hidden-tab background intervals | TQ default + explicit `refetchIntervalInBackground: false` missing in places | **Fixed** where gaps found |
| Poll while logged out | gates use `sessionReady` / query `enabled` | OK |
| Unmount leaks | intervals cleaned in effects observed | OK |

---

## Business Requirement Review

| Poll | Required? | Freshness | Hidden-tab | Unmount | Logout |
|------|-----------|-----------|------------|---------|--------|
| Broker accounts 60s | Yes | Minutes | Pause | Clear | `enabled: sessionReady` |
| Live quotes (dashboard) | Soft | ~2m after seed | Pause | Clear | enabled flag |
| Live quotes (if allowFallback) | Soft | ~30s after seed | Pause | Clear | — |
| Positions/equity | Prefer socket + 5m reconcile | Seconds via socket | Reconcile skips hidden | Clear | enabled |
| History sync pending 5s | Yes during MetaAPI lag | High | **Now pauses when hidden** | Clear | enabled |
| News/calendar | No high freq | Minutes–tens of minutes | Pause | Clear | — |
| My bots sync | Soft | Minutes | Pause | Clear | session |
| Market Watch quotes | Yes while page open | Seconds–tens of seconds by session | Pause | Clear | — |
| Admin pages | Operator | Seconds–tens of seconds | Pause | Clear | admin route |

Critical trading safety paths **not** slowed: market open quote schedule floor, MetaAPI syncPending 5s while tab visible, admin batch 3s while batch running and visible.

---

## Optimizations Applied

1. **`useLiveMarketFeed`**: honor `allowFallback`; dashboard path seeds then **120s** soft reconcile (was 18s forever); fallback path **15s → 30s** after first quotes; socket status probe 10s; focus refetch only when fallback allowed.
2. **Dashboard news/calendar**: news **5 min**; both pause when hidden + `refetchIntervalInBackground: false`.
3. **Trade history overview**: pause when hidden + background false.
4. **History page**: pause when hidden.
5. **My Bots** sync interval **60s** (was 30s).
6. **Markets** quotes/OHLC/bias/news: visibility pause; news background false.
7. **Admin / status**: visibility pause on remaining intervals; batch rates preserved when visible.

---

## Before vs After

| Path | Before (approx) | After (approx) |
|------|-----------------|----------------|
| Dashboard quotes REST | ~200 req/hr/tab | ~30 req/hr/tab (post-seed) |
| Dashboard news | ~30 req/hr | ~12 req/hr |
| My Bots `/trading/sync-bots` | ~120 POST/hr | ~60 POST/hr |
| Any paused interval while hidden | Often continued | **Stopped** for patched sites |
| Market Watch open quotes | Unchanged when visible | Unchanged when visible; **0 when hidden** |

CPU/memory/React render counts: not lab-profiled with browser tooling; expected lower fetch → less re-render on quote updates.

---

## Regression Verification

| Area | Expectation |
|------|-------------|
| Dashboard | Metrics/positions still socket/reconcile-led; market cards seed then soft-update |
| Open positions | No REST interval; realtime path unchanged |
| Notifications | No poll changes |
| Broker status | 60s account poll unchanged cadence; still pauses hidden |
| Risk / analytics | No poll intervals |
| Alpha Coach | No change |
| Marketplace / Bot Plans | No poll intervals (except my-bots sync cadence) |
| Market Watch | Same session schedule when visible |

Product refresh rates remain within expected UX for trading cards; critical fast paths preserved when visible.

---

## Performance Validation

- Measured deltas above from rate math (deterministic from code).
- Lint + tsc **PASS**.
- Production `npm run build` **PASS** (exit 0 after clean retry).

---

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/hooks/useLiveMarketFeed.ts` | Honor allowFallback; interval tiers; quieter socket probe |
| `apps/web/src/platform/dashboard/useDashboardModel.ts` | History interval visibility |
| `apps/web/src/app/(dashboard)/dashboard/page.tsx` | News/calendar cadence + visibility |
| `apps/web/src/app/(dashboard)/history/page.tsx` | Visibility |
| `apps/web/src/app/(dashboard)/my-bots/page.tsx` | 60s sync |
| `apps/web/src/app/(dashboard)/markets/page.tsx` | Visibility on polls |
| `apps/web/src/app/status/page.tsx` | Skip refresh when hidden |
| `apps/web/src/app/admin/page.tsx` | Visibility |
| `apps/web/src/app/admin/agents/page.tsx` | Visibility |
| `apps/web/src/app/admin/system/page.tsx` | Visibility |
| `apps/web/src/app/admin/kyc/page.tsx` | Visibility |
| `apps/web/src/app/admin/strategies/page.tsx` | Visibility |
| `docs/audits/dayXX-polling-audit.md` | This report |

---

## Tests Executed

| Command | Result |
|---------|--------|
| `npm run lint` | **PASS** |
| `npx tsc --noEmit` | **PASS** (`TSC_EXIT=0`) |
| `npm run build` | **PASS** |
| `npm run test` | **Not configured** |

> `npm run test` is not configured for the frontend; lint, typecheck, and production build completed successfully.

---

## Build Status

**PASS**

---

## Remaining Risks

1. Soft 120s quote refresh on dashboard may lag prices slightly vs 18s — acceptable for overview cards; Market Watch still faster.
2. My Bots status may take up to ~60s to refresh without manual navigation — PROVISIONING still has one-shot wire path.
3. Authenticated DevTools confirmation still human-facing.
4. TanStack re-evaluates interval functions periodically; visibility switches depend on next tick — ok for production.

---

## Production Readiness

Polling is production-appropriate after targeted reductions. No architecture change. Ready to ship FE image after commit/push/deploy of this change.

---

## Verdict

**PASS WITH OBSERVATIONS**
