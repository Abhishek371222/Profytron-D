# Profytron — Product Gap Report (Phase 0)

**Date:** 2026-06-18
**Method:** Static audit of the actual codebase (frontend `apps/web`, backend `apps/api`, Prisma schema, infra config). File:line references are to the real source.
**Verdict:** Profytron is **not** a greenfield project. It is a **~75–80% complete** trading platform. Most of the requested "15 phases" already exist in some form. This report is the honest inventory + a prioritized roadmap to close the genuine gaps.

> Legend: ✅ Real & wired · 🟡 Partial / conditional · 🟥 Stub / placeholder · ❌ Missing

---

## 1. Executive Summary

| Area | State | Headline |
|------|-------|----------|
| Frontend | ✅ ~80% | Polished Next.js 15 app, live-API + WebSocket data, loading/error states, 32-component UI library. Strategy Builder is the one true placeholder. |
| Backend | ✅ ~80% | 32 NestJS modules, real MetaAPI MT4/MT5 integration, BullMQ `trade_execution` queue, copy-factory, marketplace, payments, analytics, AI coach, Telegram bot, AI agent framework. |
| Database | ✅ 7/10 | 43 Prisma models, 10 real migrations, recent performance indexes. Copy-trading modeled implicitly; no Backtest/StrategyVersion tables. |
| Infrastructure | 🟡 5/10 | Docker compose, dual-mode Redis (local/Upstash), CI for test+security scans. No observability, no partitioning, single-DB/single-Redis. |

**The genuine gaps** (everything else exists): trade management actions + manual order UI, account health monitoring, configurable sync, **risk auto-enforcement** (currently flags but never acts), the **Strategy Builder execution engine + codegen**, the **backtesting engine** (delegates to a service that isn't in the repo), observability, and scale hardening.

---

## 2. Frontend Audit (`apps/web`)

**Stack:** Next.js 15 (App Router) · React 19 · Zustand · TanStack Query · Axios · socket.io-client · Framer Motion · Recharts · ReactFlow · Tailwind + CVA + Radix primitives.

### Routes / pages
- Route groups: `(dashboard)` (protected), `(public)` (auth flows), `admin/`, plus marketing pages.
- ✅ Wired to live APIs: `dashboard`, `analytics/*` (portfolio/performance/risk/trade/global), `copy-trading`, `marketplace` + `[id]`, `wallet`, `journal`, `history`, `leaderboard`, `strategies` + `[id]`, `ai-coach`, `notifications`, `affiliate/*`, `settings/profile`, `settings/billing`.
- 🟥 `strategies/builder/page.tsx` — "Coming soon" placeholder, disabled Run Backtest (line ~66).
- 🟡 `settings/{security,trading,api-keys,notifications,support}` — referenced; depth unverified, likely partial.
- ❌ `dashboard/bots` — referenced in nav, no page file found.

### Feature state (dashboard)
- ✅ Trading dashboard: live portfolio, open positions (read-only), risk monitor (display-only kill switch), market quote cards over WebSocket, equity chart.
- ✅ Analytics suite, marketplace, copy-trading purchase + broker connect, wallet (deposit/withdraw via Razorpay), journal, history (CSV export), leaderboard, AI coach (Claude chat), notifications center.
- 🟥 Strategy builder (placeholder). ❌ Manual order entry / order-placement form. ❌ Trade actions on positions (close/modify/partial/etc.). ❌ Risk config is read-only display, not editable.

### Quality
- ✅ `loading.tsx`/`error.tsx`/`not-found.tsx` across most routes; Suspense in marketplace; `dynamic()` for heavy charts; React Query placeholder retention.
- ✅ API client `lib/api/client.ts` with Bearer + 401 refresh + redirect; 25 typed API modules; `unwrap()` helper.
- ✅ Realtime hooks: `useLiveMarketFeed`, `useDashboardRealtime`, wallet updates; `wsConnected` badges.
- Mock layer (MSW) behind `NEXT_PUBLIC_ENABLE_MOCK_API`; some demo constants in AI coach (e.g. hardcoded score) and dashboard AI panel bullets.

---

## 3. Backend Audit (`apps/api`)

**Stack:** NestJS · Prisma · BullMQ (Bull) · Redis (auth/cache/sessions) · socket.io gateway · `@nestjs/schedule`.

### Module inventory (32) — status
- ✅ Fully implemented: `auth` (JWT + 2FA + OAuth), `users`, `marketplace`, `payments` (Stripe + Razorpay demo mode), `wallet`, `subscriptions`, `analytics` (Redis-cached), `leaderboard`, `journal`, `email` (Resend), `support`, `affiliates`, `api-keys`, `feature-flags`, `preferences`, `growth`.
- 🟡 Partial / conditional: `broker` & `trading` (MetaAPI when `METAAPI_TOKEN` set, else labelled mock), `copy-factory` (delegates to MetaAPI SDK), `strategies` (CRUD ok; backtest delegated), `ai` (OpenRouter), `ai-risk` (flags only), `market` (TwelveData + synthetic fallback), `social` (manual profile stats), `notifications` (email + WS; FCM if creds present), `telegram`, `agents` (behind `AGENTS_ENABLED`), `websocket`.
- 🟥 Stub: `strategy-builder` (stores nodes/edges only, **no HTTP controller**), `vps` (pricing table only), `admin` (dashboard stubs), `search` (no visible impl).

### Trading core specifics
- Broker connect via `MetaTraderAdapter` (MT4/MT5, region-aware, CopyFactory roles). `PaperBrokerAdapter` for demo. `isLive` false without token → all calls return labelled mocks (`broker/adapters/metatrader.adapter.ts`).
- Execution: BullMQ `trade_execution` → `trade.processor.ts` (`execute_trade`, `close_copy`); paper trades auto-close after 10s for sim. Volume hardcoded `0.1` for non-copy signals.
- Sync: `master-sync.service.ts startPolling(3000)` fixed 3s; CopyFactory path when enabled.
- 🟥 Account health monitoring: none (relies on MetaAPI SDK). 🟥 Risk: `ai-risk.service.ts stopTradingIfNeeded()` (line ~88) returns boolean only; `monitorRiskPolicies` cron only writes an audit log — **no halt, no auto-close**.

### Infra patterns
- ✅ Queues: `trade_execution`, `copyfactory_sync`, `withdrawal-processing`. Redis: caching (OHLC/analytics/leaderboard/backtest), rate-limit, sessions, OTP, token blacklist. WebSocket `TradingGateway`. EventEmitter agent outbox. `@nestjs/schedule` intervals/crons; graceful shutdown enabled.

### Notable mock/stub markers
- `main.ts` boot warnings for missing `METAAPI_TOKEN`, `MASTER_BROKER_ACCOUNT_ID`.
- `broker/adapters/mt5.adapter.ts` — fully fake. `paper.adapter.ts` — intentional demo balances.
- `strategy-builder.service.ts` — CRUD-only. `strategies.service.ts` (~line 488) — POSTs to `BACKTEST_SERVICE_URL`, throws "Backtest service unavailable" on failure. `ai-risk.service.ts` — flag-only. `vps.service.ts` — pricing only.

---

## 4. Database Audit (`apps/api/prisma`)

- **43 models**, PostgreSQL (Neon), `DATABASE_URL`+`DIRECT_URL`, Prisma 5.22.
- Core: `User`, `BrokerAccount`, `Strategy`, `StrategyPerformance`, `UserStrategySubscription`, `Trade`, `WalletTransaction`, `MarketplaceListing`, `Payment`/`Invoice`, `SubscriptionPlan`/`UserSubscription`, `AiRiskPolicy`, `StrategyBuilder`/`StrategyNode`/`StrategyEdge`, `VpsAccount`/`BotInstance`, agent tables, `AuditLog`, `Notification`, etc.
- **10 real migrations** (init → schema sync → master-broker → copyfactory id → growth → AI workforce → perf indexes → broker initial equity → analytics trade indexes). Not `db push`.
- **Indexes:** good recent additions on `Trade`, `BrokerAccount`, `WalletTransaction`. Gaps: no `Trade(strategyId, openedAt)` composite, no partial indexes excluding soft-deletes.
- **Relationships / gaps:** copy-trading modeled implicitly via `UserStrategySubscription` + `Strategy.masterBrokerAccountId` (no explicit relationship table). ❌ No `BacktestRun`, `StrategyVersion`, `ConnectionLog`, `AlertRule`, instrument master.
- **Seed:** `seed.ts` creates demo/admin users with hardcoded `Demo@123` — ⚠️ never run in production.
- `Trade.stopLoss`/`takeProfit`/`executionMetadataJson` already exist → SL/TP/trailing need no migration.

---

## 5. Infrastructure Audit

- **Docker:** `docker-compose.yml` (postgres 15, redis 7 with LRU+AOF, redis-commander, bull-board). `apps/api/Dockerfile` multi-stage node:20-alpine; no in-Dockerfile healthcheck.
- **Redis:** dual mode — local or Upstash REST; security-critical prefixes fail hard on Redis loss; non-critical keys fall back to in-memory map. Single node (no sentinel/cluster).
- **CI:** `.github/workflows/testing.yml` (type/lint/build + jest + dep audit), `security.yml` (Trivy fs+image, CodeQL, TruffleHog, Semgrep, npm/pnpm audit). No deploy/registry-push step.
- **Env:** DB, Redis, JWT/AES, Stripe/Razorpay, MetaAPI/CopyFactory, TwelveData, Firebase, Resend, `AI_SERVICE_URL`, `BACKTEST_SERVICE_URL` (external, not in repo).

### Scalability concerns (100K users / millions of trades)
- 🟥 Single PostgreSQL, no read replicas. 🟥 Unbounded `Trade` table, no partitioning/archival. 🟥 Single Redis. 🟡 Missing composite/partial indexes. 🟡 No global rate-limit config surfaced. ❌ No observability (Sentry/OTel/Grafana/Prometheus). ❌ No search index. ❌ Audit log unbounded.

---

## 6. Gap Summary

**Broken / non-functional**
- Backtesting (external `BACKTEST_SERVICE_URL` not present → throws).
- Risk limits do not enforce (flag-only).
- Strategy Builder (frontend placeholder + backend has no controller).

**Incomplete**
- Trade lifecycle actions (close/partial/modify SL-TP/break-even/trailing/bulk) + manual order entry.
- Account health monitoring + configurable sync interval.
- Notification channels: WhatsApp/SMS/Discord (Telegram/email/push exist).
- Social auto profile stats; marketplace "rent" + automated payouts; VPS provisioning.

**Missing entirely**
- Observability stack; native mobile apps; SEO/content engine; multi-region scale/DR.

---

## 7. Prioritized Roadmap (Phases 1–15)

**P0 — Build now (this iteration):**
1. **Trading core (Phase 1):** trade actions + manual order, account health + configurable sync, **risk auto-enforcement**. *Highest value: "without this the product has no value."*
2. **Strategy Builder + Backtesting (Phases 2–3):** node-graph → `StrategyDefinition`, in-process TS backtest engine (replaces missing service), Pine/MQL5 codegen, real ReactFlow editor.
3. **Scale & observability (parts of 11–12):** Sentry + OpenTelemetry/metrics, Trade indexes + partitioning plan, cache extension.

**P1 — Next (separate iterations, mostly extend existing code):**
- Copy-trading hardening for 1k–10k followers + latency tracking (Phase 4); marketplace rent + payout automation + revenue split (Phase 5); AI coach daily/weekly/monthly reviews + per-trade analysis depth (Phase 6); advanced analytics (Sortino/VaR already partially present) (Phase 7); payments coupons/trials/upgrades/refunds polish (Phase 8); notification channels WhatsApp/SMS/Discord (Phase 10); event-driven/caching depth (Phase 11).

**P2 — Separate multi-month tracks (NOT single-session work):**
- **Phase 9 — Mobile apps:** native Android/iOS — its own project.
- **Phase 13 — Customer acquisition:** 100+ landing pages, 500 SEO articles, 200 tutorials, 100 videos — content/marketing track.
- **Phase 14 — Monetization tiers** (₹999/₹2999/₹9999/Enterprise): plan config exists; needs pricing/packaging + gating work.
- **Phase 15 — Scale to 100K:** multi-region, auto-scaling, load balancing, full DR, read replicas — infra track.

---

## 8. What this iteration delivers

Per the approved plan (`.claude/plans/velvety-herding-scroll.md`): this Phase-0 report, then the **P0** build — broker-agnostic (paper now, live MetaAPI via `METAAPI_TOKEN`), additive migrations only, destructive actions (auto-close, bulk-close) default OFF and idempotent. P1/P2 are tracked here as the roadmap, not built in one pass.
