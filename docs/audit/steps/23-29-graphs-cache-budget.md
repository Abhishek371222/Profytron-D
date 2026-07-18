# Steps 23–29 — Dependency Graphs, Cache Lifecycle, MT5 Timeline, Budgets, Memory Growth, WebSocket, Animation Graph

## Step 23 — Dashboard dependency graph

See `docs/audit/diagrams/dashboard-dependency.md`.

Summary chain:

```
BrokerAccount (API)
  → hasBrokerAccount / defaultAccount
    → enables portfolio, open-trades, risk, trade-history
MetaApi (via portfolio source=metaapi OR adapter equity)
  → stickyAccount / OverviewMetricCards
Open trades query ← socket trade_* invalidation
Quotes feed ← socket price_update + REST
Risk ← risk API
Strategies ← my-strategies ← bot_activated events
Notifications ← new_notification
```

## Step 24 — Cache lifecycle

| Layer | Create | TTL / expire | Refresh | Invalidate | Persist | Sync |
|-------|--------|--------------|---------|------------|---------|------|
| TanStack Query | fetch | staleTime 60s (dashboard) | refetchInterval 60s | socket 400ms debounce; focus on some | session hydrate helpers | multi-tab weak |
| overview-account-cache | write on live snapshot | manual clear | on new snapshot | clear on no broker | local/session | per userId |
| Redis analytics | set on compute | 30s–2m | miss | TTL | Redis | multi-instance |
| MetaApi equity memory | adapter getLiveEquity | **30s** | miss → REST | process local only | none | single process |
| mastersync Redis positions | poller | 24h | poll | overwrite | Redis | leader lock |
| Zustand auth | login | storage | hydrate | logout | localStorage | — |

## Step 25 — MT5 synchronization timeline

See `docs/audit/diagrams/mt5-sync-sequence.md` (measured ms on arrows).

## Step 26 — Rendering budgets

See `docs/audit/budgets/route-budgets.json` (seeded from measurements; aspirational targets for Phase 2).

## Step 27 — Memory growth

| Duration | Status |
|----------|--------|
| 3 min proxy | Captured — inconclusive (dashboard not fully mounted) |
| 30 min | NOT MEASURED |
| 1 hour | NOT MEASURED |
| 4 hours | NOT MEASURED |

## Step 28 — WebSocket audit

| Item | Finding |
|------|---------|
| Namespaces | `/trading`, `/coach` |
| Singletons | `acquireTradingSocket` ref-counted |
| Duplicate risk | `wallet/page.tsx` ad-hoc `io()` |
| Reconnect | `reconnectTradingSocket` exported |
| Bandwidth | price_update every **8s** broadcast server-side |
| Dropped packets / backlog | NOT MEASURED (needs instrumented gateway) |

## Step 29 — Animation dependency

```
Lenis scroll → LandingPageClient → layout/paint → long tasks
framer-motion → DashboardLayout / widgets → React commit → composite?
three.js → AuthGlobe → GPU texture upload → FCP delay
recharts → OverviewPerformance → SVG layout → CPU
TradingView → iframe → separate process
```
