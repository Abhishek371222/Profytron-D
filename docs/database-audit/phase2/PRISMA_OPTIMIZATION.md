# PRISMA_OPTIMIZATION — Phase 2

**Evidence:** `DB-P0-RTT`, Phase 1 QUERY_REPORT (SQL 0.02–0.18 ms vs Prisma wall hundreds–thousands ms).

## Principle

Do **not** rewrite SQL that already executes in sub-millisecond time. Optimize **round-trips**, batching, and connection topology.

## Changes

| Area | Change | Files |
|------|--------|-------|
| Audit harness | Added `prisma_batched_broker_by_users` alongside sequential N+1 probe | `tools/database-audit/live-audit.mjs` |
| Wallet | `updateMany` for pause/resume profit-share status groups | `wallet.service.ts` |
| Payments | `updateMany` for resume liability groups | `payments.service.ts` |
| Copy sync | `$transaction([...upserts])` for master profiles + relationships | `copy.service.ts` |

Sync Engine / MetaAPI poll loops **unchanged** (locked).

## Connection topology

See `data/topology.json` and section below.

```
App (Nest) → PrismaClient → Neon pooler (DATABASE_URL) → Postgres compute
                          ↘ DIRECT_URL (migrations / catalog / EXPLAIN)
```

### Guidance (documented in `.env.example`)

- Prefer pooler host (`-pooler`) for runtime `DATABASE_URL`.
- Append `connection_limit=10&pool_timeout=10` on the pooler URL (Prisma query params).
- Keep `DIRECT_URL` non-pooler for migrations / heavy catalog.
- Co-locate API region with Neon compute (`us-east-1` for current project) — ops action; largest RTT lever.

## Serialization

No broad DTO changes. Batching reduces Prisma query-event count on audited paths; avoid `include` trees that fan out unless required by response contract (contracts frozen).
