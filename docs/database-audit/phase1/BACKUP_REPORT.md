# BACKUP_REPORT — Phase 1

## Strategy (documented)

| Item | Finding |
|------|---------|
| Primary store | Neon Postgres (`provider = postgresql`, pooler + direct URLs) |
| PITR | Referenced in `deploy/gcp/RUNBOOKS.md` — Neon branch / PITR restore |
| In-repo automated dump | Not found as CI job for nightly `pg_dump` |
| App-level “backup codes” | 2FA recovery codes only (not DB backups) |

## Restore procedure (evidence pointer)

From deploy runbooks: if Neon, use **Neon PITR / branch restore** (external console). Exact clicks/CLI not duplicated here to avoid drift — verify against current Neon plan.

## Point-in-time recovery

| Question | Phase 1 answer |
|----------|----------------|
| Is PITR available? | Expected yes on Neon paid plans — **confirm in Neon console** |
| RPO / RTO documented in-repo? | **No hard numbers** found — Phase 2 input |
| Restore drill evidence? | **Missing** — schedule drill |

## Disaster recovery

1. Restore Neon branch / PITR to new connection string  
2. Point `DATABASE_URL`/`DIRECT_URL` + run `prisma migrate deploy` if schema ahead  
3. Redis is **ephemeral cache/session** — expect rehydrate from DB  
4. Bull queues: jobs may need redrive

## Gap

Phase 1 can verify **documentation existence**, not a live restore. Marked **P1** in priority matrix.
