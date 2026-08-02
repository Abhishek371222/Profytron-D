# D1 — Production infrastructure

**Full index:** [`D1_README.md`](./D1_README.md)

## Engineering shipped

- `GET /live` — liveness  
- `GET /ready` — readiness (DB)  
- `GET /health` — dependency snapshot (MetaAPI never hard-fails)  

## Ops pending

See [`D1_CHECKLIST.md`](./D1_CHECKLIST.md) and [`OPERATIONS_DASHBOARD.md`](./OPERATIONS_DASHBOARD.md).

## Cloud SQL cleanup (2026-07-23)

`profytron-postgres` is the sole production database (confirmed live via `DATABASE_URL`/`DIRECT_URL` host match, provisioning script, connection logs, and Cloud Monitoring). A second, unused instance (`profytron`) was found — created outside the checked-in provisioning script, zero recent connections, not referenced by any Cloud Run service or app config. It was stopped (`activation-policy=NEVER`) so it stops incurring compute cost, without deleting it, its storage, backups, or users. Production API and web health (`/live`, `/ready`, `/health`) and error logs were verified clean before and after, with no impact observed.
