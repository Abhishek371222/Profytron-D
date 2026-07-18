# PHASE2_INPUTS — Database (from Phase 1 evidence)

Use these as the **only** authorized improvement themes unless new evidence appears.

## Must address first

1. **RTT / topology** — co-locate API with Neon region or reduce chatty Prisma round-trips.  
2. **N+1 elimination** on admin/list and dashboard aggregations.  
3. **FK index gaps** (if any remain in `fkIndexGaps`) — additive indexes only.  
4. **Backup restore drill** — document RPO/RTO with screenshot/CLI log.

## Should address

5. Snapshot retention policy for `AccountSnapshot*` / `EquitySnapshot`.  
6. Redis key-prefix map + invalidation ownership matrix.  
7. Re-run EXPLAIN when trades > 100k.  
8. Confirm Neon app role is least-privilege (non-superuser).

## Do not start without new evidence

- Dropping “unused” indexes after a short lab session  
- RLS rollout  
- Sharding / Citus  
- Rewriting trading write path  

## Acceptance for any Phase 2 PR

- Before/after: EXPLAIN + Prisma wall timings in `docs/database-audit/phase2/data/`  
- No behavior change outside listed findings  
- Migrations reversible or expand/contract documented
