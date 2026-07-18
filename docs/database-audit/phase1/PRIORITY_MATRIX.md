# PRIORITY_MATRIX — Phase 1

| ID | Sev | Area | Finding | Phase 2 action |
|----|-----|------|---------|----------------|
| DB-P0-FK-INDEX | P0 | Indexes | 7 FK column(s) without leading index | Add migration indexes for FK gaps only after validating write/read ratio |
| DB-P0-RTT | P0 | Query / Topology | Prisma wall time dominated by network RTT (top prisma_n1_broker_per_user: 3179.3 ms) while EXPLAIN execution is sub-ms at current scale | Co-locate API↔DB region; batch round-trips; keep Redis warm paths |
| DB-P1-N1 | P1 | Query patterns | Sequential per-user broker fetches wall 3179.3 ms | Replace with findMany where userId in [...] |
| DB-P2-UNUSED-IX | P2 | Indexes | 235 indexes with idx_scan=0 (stats-dependent; may be cold) | Re-check after production traffic window before DROP |
| DB-P1-SNAPSHOT-GROWTH | P1 | Storage | Largest table today: AccountSnapshotOrderHistory (18.02 MB, ~17528 rows) — AccountSnapshot* already dwarf Trade | Retention/partition for snapshot child tables; cap history ingest |
| DB-P2-DUP-IX | P2 | Indexes | 14 duplicate index signatures (often @@index overlapping @unique/@unique constraint) | Drop redundant non-unique twin indexes after confirming planner still uses unique |
| DB-P2-RLS | P2 | Security | No Postgres RLS expected — authorization is app-layer (NestJS/JWT) | Document threat model; consider RLS only if multi-tenant SQL access expands |
| DB-P1-BACKUP-VERIFY | P1 | Backup | Neon PITR referenced in runbooks; restore drill evidence not in-repo | Quarterly restore drill; document RPO/RTO from Neon plan |

## Severity rubric

- **P0** — integrity break or universal latency pathology  
- **P1** — clear scale/ops risk with evidence  
- **P2** — hygiene / defend-in-depth / cold stats  
- **P3** — speculative; defer

## Explicitly out of Phase 1

- Adding/removing indexes in prod  
- Data deletes/repairs  
- Schema migrations  
- Auth/trading logic changes
