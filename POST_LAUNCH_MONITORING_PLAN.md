# Profytron — Post-Launch Monitoring Plan

Builds on what already exists: Sentry (`apps/api/src/instrument.ts`, web Sentry), OpenTelemetry
tracing (`apps/api/src/tracing.ts`), `/health` (503 on DB-degraded), structured logging (winston).
The gaps below are what to add/watch; prefer wiring alerts on existing signals over new platforms.

Each signal: **What → Why → Baseline → Alert → Investigate → Mitigate → Owner.**

---

## First Hour

| Signal | Detail |
|---|---|
| Availability (`/health`) | **What:** uptime ping every 30s. **Alert:** 2 consecutive non-200. **Investigate:** Render logs, Neon, Redis. **Mitigate:** rollback. **Owner:** SRE. |
| Login success rate | **What:** ratio of successful logins/OAuth callbacks. **Why:** OAuth/cookie/domain misconfig is the #1 launch failure. **Alert:** success <90%. **Investigate:** callback logs, `FRONTEND_URL`, Google redirect URIs. **Owner:** Backend. |
| API 5xx rate | **What:** Sentry/issue rate + log 5xx. **Alert:** >1% of requests. **Investigate:** top Sentry issue + correlation id. **Mitigate:** rollback. **Owner:** Backend. |
| DB connections | **What:** Neon active connections vs limit. **Why:** multi-instance + no explicit pool sizing → exhaustion. **Alert:** >80% of limit. **Mitigate:** reduce instances / add pooler. **Owner:** DB. |
| Redis connectivity | **What:** confirm app connected to **real** Redis (not in-memory). **Alert:** any "in-memory Redis" log line in prod. **Owner:** SRE. |
| BullMQ queue health | **What:** trade-execution jobs processed vs enqueued. **Why:** silent failure if Redis misconfigured. **Alert:** queued>0 with processed=0 for 2 min. **Owner:** Backend. |
| Deployment logs | **What:** confirm schema apply ran, no migration error, no boot crash. **Owner:** SRE. |

## First 24 Hours

| Signal | Detail |
|---|---|
| Signup/OAuth callback failures | Trend per provider; alert on spike. Investigate redirect/cookie/SameSite. |
| API latency (p50/p95/p99) | Baseline from staging; alert p95 > 2× baseline. Investigate slow queries / unbounded findMany (DB-2). |
| 4xx trends | 401/403 spikes = auth regressions; 413 = body-limit friction; 429 = throttling too tight (verify `trust proxy` working). |
| Backtest failures | Failed/stuck jobs; alert on rising failure ratio or jobs stuck > N min. |
| AI failures/timeouts | Error/timeout rate to AI service; ensure UI shows safe failure, not fabricated results. |
| Duplicate financial ops | **Why:** Razorpay webhook lacks idempotency (FIN-2). **What:** alert on duplicate `razorpayPaymentId`/`stripePaymentId` attempts, or revenue counters jumping on webhook retries. **Owner:** Payments. |
| Memory/CPU | Render instance metrics; alert on sustained >80% / restart loops (uncaughtException keep-alive can mask bad state). |
| DB query latency | Slowest statements (Neon insights); flag full scans on growing tables. |
| User-reported issues | Support inbox/Telegram; triage login loops, stale dashboards, payment disputes. |

## First Week

| Signal | Detail |
|---|---|
| Error trends | Week-over-day Sentry; watch new issues after each deploy. |
| Slow queries | Re-check unbounded `findMany` (analytics/marketplace/admin/support) as data grows; add pagination/indexes. |
| DB connection usage | Trend toward limit as concurrency rises; plan pooler/scaling. |
| Cache/Redis behavior | Eviction rate, memory; ensure no business-critical data lost on eviction (snapshots — REDIS-1). |
| Stuck jobs | BullMQ stalled/failed; confirm jobId idempotency prevents duplicates; DLQ review. |
| **Wallet reconciliation** | Daily: Σ(confirmed IN) − Σ(confirmed OUT) per user == reported balance; affiliate `totalEarned − totalPaid` consistency. **Why:** Float drift (FIN-5) + refund non-reversal (FIN-4). Alert on any mismatch. **Owner:** Finance/Backend. |
| Affiliate anomalies | Spike in referrals/commissions, self-referral attempts, duplicate attributions. |
| Support volume | Categorize; watch OAuth, payments, mobile. |
| Mobile/browser failures | Sentry by device/browser; watch iOS Safari cookie/OAuth issues. |
| Storage growth | Trade/notification/audit/email tables and backtest results; project growth, plan retention. |

## Operator "Can we answer?" checklist

Before launch confirm operators can answer: Is the app up? Which service is failing? When did it
start? Which deploy caused it? Who is affected? Are requests slow/failing? Is Postgres healthy? Is
Redis healthy? Are jobs stuck? Are AI/backtest calls timing out? Can a request be traced cross-service
(OTel)? Can we roll back safely? — Today: mostly **yes** via Sentry/OTel/health, **except** queue-depth,
duplicate-financial-op, and ledger-reconciliation alerts, which must be added.
