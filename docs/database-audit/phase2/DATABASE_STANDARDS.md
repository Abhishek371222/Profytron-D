# DATABASE_STANDARDS — Phase 2

## Naming

- Models: PascalCase (`BrokerAccount`). Tables: Prisma default quoted PascalCase.
- FK scalars: `<relation>Id` (`userId`, `brokerAccountId`).
- Indexes: Prisma defaults (`Model_field_idx` / `_key`).

## Indexes

- Every FK column must have a **leading-column** index (single-column or composite starting with the FK).
- Do not add `@@index` that duplicates `@unique` / `@@unique` on the same column list.
- Do not drop indexes solely because `idx_scan = 0`.

## Foreign keys

- Prefer Prisma `@relation` with explicit `onDelete` (`Cascade` / `SetNull` / `Restrict`) matching product rules.
- Integrity suite: orphans on hot paths must stay at 0.

## Migrations

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).

## JSON usage

- `Json` / `rawJson` for denormalized MetaAPI payloads and flexible config.
- Prefer child tables for high-cardinality history (snapshot children); archive cold history — do not unbounded-grow hot tables.

## Soft delete vs archive

- Soft delete: `deletedAt` on domain entities (e.g. Strategy) when product needs resurrection.
- Snapshot history: **soft-archive** to `*Archive` tables; cleanup only after archive TTL.

## Audit / timestamp columns

- `createdAt` `@default(now())`, `updatedAt` `@updatedAt` on mutable entities.
- Snapshot children: `capturedAt` (ingest time); archive: `archivedAt`.
- Never allow `closedAt < openedAt` on Trade (integrity check).

## Connection

- Runtime: Neon pooler `DATABASE_URL` with `connection_limit` / `pool_timeout`.
- Migrations / EXPLAIN: `DIRECT_URL`.
- App-layer authZ; Postgres RLS not required unless SQL multi-tenant access expands.
