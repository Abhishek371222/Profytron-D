# Phase 3 Implementation Summary

## What shipped

1. **SyncEngine (Nest)** — `apps/api/src/modules/sync/` with Redis watermarks, entity diffs, versioned WS deltas.
2. **Poller wiring** — AccountHistorySync (vanish-open fix), BotTradeSync, CopyFactoryPositionSync.
3. **MT5 FSM (web)** — Idle/Synchronizing/Fresh/Degraded/Recovering with timestamps + version gate.
4. **Delta processor** — `setQueryData` for equity + open trades; L2 overview patch; no equity invalidate storm.
5. **Scheduler ownership** — refreshAll / trade actions / BG reconcile via priority lanes; broker `refetchInterval` removed.
6. **Observability** — `metricsApi.mark` on deltas/invalidates/refresh; Nest sync timing buffer.
7. **Governance** — ADRs 001–004, diagrams, exit criteria, Phase 4 recs.

## Architecture (after)

```
MetaApi REST → Nest pollers → SyncEngine → Redis watermarks + Postgres
                         ↓
              WS positions_delta / account_equity / sync_status
                         ↓
         Platform Scheduler → DeltaProcessor → Cache + TanStack → UI
```

## Rollback

- API: `SYNC_ENGINE_ENABLED=0`
- Web: re-enable `refetchInterval: 60_000` on dashboard broker queries if needed

## Remaining bottlenecks

- MetaApi RTT still 0.7–1.8s on cache miss (poller-bound)
- No pending-orders sync
- History still HTTP-reconciled on trade_* fallback
- Landing CWV unchanged
