# SNAPSHOT_POLICY — Phase 2

**Evidence:** `DB-P1-SNAPSHOT-GROWTH` — `AccountSnapshotOrderHistory` largest table (~18 MB).

## Decision (layered)

| Layer | Policy |
|-------|--------|
| Retention (hot) | Keep rows with `capturedAt` within `SNAPSHOT_HOT_KEEP_DAYS` (default **14**). Never archive rows still referenced by `AccountLatestSnapshot`. |
| Soft archive | Move eligible hot rows → `*Archive` tables (same payload + `archivedAt`). |
| Compression | Rely on Postgres TOAST for `Json`/`rawJson`; no Sync Engine writer change. |
| Cleanup | Delete from **archive only** when `archivedAt` older than `SNAPSHOT_ARCHIVE_TTL_DAYS` (default **365**). |

**No hot-table hard delete of unrearchived data. No Sync Engine ingest changes.**

## Schema

Additive tables (migration `20260719030000_phase2_snapshot_archive_tables`):

- `AccountSnapshotOrderHistoryArchive`
- `AccountSnapshotDealArchive`
- `AccountSnapshotSymbolArchive`
- `AccountSnapshotMarketDataArchive`

## Tooling

```bash
pnpm db-audit:snapshot              # dry-run (default)
pnpm db-audit:snapshot -- --apply   # move batch
pnpm db-audit:snapshot -- --apply --cleanup  # + archive TTL delete
```

Evidence: `data/snapshot-lifecycle.json`.

## Ops schedule (recommended)

Nightly dry-run in CI/ops; `--apply` under change window after reviewing eligible counts. Cap batch via `SNAPSHOT_BATCH_SIZE` (default 500).
