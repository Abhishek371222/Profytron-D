# Copy Trading — Architecture, Scaling & Failure Handling

This documents what was implemented for the copy-trading core (risk engine,
lot sizing, event/execution ledger, DLQ, scaling) and how to run it.

## Runtime topology

```
            ┌─────────────┐
  clients ─►│   nginx LB  │  deploy/nginx.prod.conf (per-request DNS round-robin)
            └──────┬──────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
     ┌──────┐  ┌──────┐  ┌──────┐   api replicas (NestJS).
     │ api  │  │ api  │  │ api  │   Each is ALSO a BullMQ worker:
     └──┬───┘  └──┬───┘  └──┬───┘   trade_execution processors run in-process.
        └─────────┼─────────┘
                  ▼
            ┌───────────┐     ┌──────────────┐
            │   Redis   │◄───►│  PostgreSQL  │
            │ queues +  │     │  (Prisma)    │
            │ cache +   │     └──────────────┘
            │ leader    │
            └─────┬─────┘
                  ▼
            ┌───────────┐
            │  MetaApi  │ → MT4 / MT5 brokers
            └───────────┘
```

Scale workers/execution throughput with:

```bash
docker compose -f docker-compose.prod.yml up -d --scale api=4
```

### Why scaling is safe
- **Queue consumers**: BullMQ pulls jobs from Redis, so every `api` replica
  shares the `trade_execution` workload automatically. More replicas = more
  parallel executions.
- **Singleton master polling**: `MasterSyncService.pollAllMasters` acquires a
  Redis **leader lease** (`mastersync:leader`, `RedisService.tryRenewableLock`).
  Only the leader fans out copies, so replicas never double-execute a master
  trade. The lease auto-expires (10s) → instant failover if the leader dies.
- **Snapshot durability**: master position snapshots are persisted to Redis
  (`mastersync:positions:<accountId>`), so a restart/failover doesn't miss
  closes or re-fire opens.

## Risk enforcement (pre-trade + active)
- `AiRiskService.evaluatePreTrade(userId)` runs in `TradeProcessor` before
  **every** entry (copy / signal / manual). Enforces: max open trades, daily
  loss (USD + %), and drawdown, from the user's `AiRiskPolicy`.
- Hard breaches (daily loss / drawdown) trigger `enforceRiskStop`: pause active
  copy subscriptions + queue close for all open positions + audit + notify.
- A 5-minute cron (`monitorRiskPolicies`) sweeps policies for breaches that
  happen between trades (opt-in via `autoStopAfterLoss`).
- Configurable via `PUT /risk/policy` (UI: Settings → Trading).

## Lot sizing (`utils/lot-sizing.util.ts`)
Three deterministic methods, clamped + lot-stepped:
- `FIXED` → `fixedLot`
- `MULTIPLIER` → `masterVolume × multiplier`
- `EQUITY_RATIO` → `masterVolume × (E_follower / E_master) × multiplier`

Equity is read live from the broker (`MetaTraderAdapter.getLiveEquity`, 30s
cache) with fallback to `BrokerAccount.initialEquity`. Mode/fixedLot come from
the subscription's `executionProfileJson`.

## Resilience / failure handling
- `trade_execution` jobs use `attempts: 3` + exponential backoff.
- On real failures (MetaApi errors) the processor **throws** so Bull retries.
- After retries are exhausted, `TradeProcessor.onJobFailed` routes the payload
  to the **`trade_execution_dlq`** queue.
- `TradeDlqProcessor` persists dead-lettered jobs to `AuditLog`
  (`TRADE_JOB_DEAD_LETTER`) and notifies the user (`trade_failed` socket +
  ERROR notification) for inspection / manual replay.
- Non-retryable conditions (no broker account, risk block) return without
  throwing, so they don't burn retries.

## Data model (additive — `migrations/20260618000000_copy_trading_domain`)
- `MasterProfile` — queryable master-trader profile (ROI, drawdown, win rate…).
- `CopyRelationship` — explicit master↔follower link with per-follower sizing &
  risk config.
- `TradeEvent` — append-only lifecycle log (signal/open/modify/close/blocked/
  failed) written by `CopyLedgerService`.
- `TradeExecution` — master-ticket → follower-ticket execution map with
  latency, slippage, fill, and status.

These are additive; the existing `Strategy` + `UserStrategySubscription` copy
flow continues to work. Backfill / cut-over of the legacy JSON metadata into the
new tables can be done incrementally.

## Monitoring
- `GET /health` — DB + Redis liveness (used by the container healthcheck).
- Bull Board (dev compose, `:3002`) — queue depth, failures, DLQ contents.
- `AuditLog` event types: `RISK_LIMIT_TRIGGERED`, `TRADE_BLOCKED_RISK_LIMIT`,
  `TRADE_JOB_DEAD_LETTER`.

## Apply the migration
With `DATABASE_URL` set:

```bash
cd apps/api
npx prisma migrate deploy   # applies 20260618000000_copy_trading_domain
npx prisma generate
```
