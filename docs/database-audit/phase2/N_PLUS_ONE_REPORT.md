# N_PLUS_ONE_REPORT — Phase 2

**Evidence:** Phase 1 `DB-P1-N1` — harness sequential broker fetch ~3.2–3.4 s wall.

## Measured harness path

### Before (Phase 1 / before-*)

Sequential:

```ts
for (const u of users) {
  await prisma.brokerAccount.findMany({ where: { userId: u.id } });
}
```

Wall: **~3179–3368 ms** (10 users) — dominated by Neon RTT × N.

### After (Phase 2)

Batched:

```ts
await prisma.brokerAccount.findMany({ where: { userId: { in: ids } } });
```

Harness now records both:

| Probe | Purpose |
|-------|---------|
| `prisma_n1_broker_per_user` | Regression canary (still sequential) |
| `prisma_batched_broker_by_users` | Optimized pattern |

See `data/after-query-timings.json` for wall times.

**Target:** single batched query ≈ 1–2 RTT instead of N+1.

## Production paths fixed (same API contracts)

| Path | Before | After |
|------|--------|-------|
| `wallet.pauseProfitShareBelowBuffer` | N× `update` | 1× `updateMany` + enqueue loop |
| `wallet.reconcileProfitShareAutoResume` | N× `update` | ≤2× `updateMany` by liability group |
| `payments` resume loop | N× `update` | ≤2× `updateMany` |
| `copy.syncMasterProfiles` | N× sequential upsert | 1× `$transaction(upserts)` |
| `copy.syncCopyRelationships` | N× sequential upsert | 1× `$transaction(upserts)` |

Queue enqueues remain per-id (external side effects); DB round-trips batched.

## Explicitly not changed

Account history sync sequential trade closes / MetaAPI poll loops (Synchronization Engine lock).
