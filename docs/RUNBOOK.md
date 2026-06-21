# Profytron Operations Runbook

Operational procedures for running Profytron in production: deployment,
rollback, backups/DR, secret rotation, scaling, and incident response.

> Application code lives in `apps/`. Infra/deploy assets referenced here live in
> `deploy/`, `scripts/`, and `.github/workflows/`.

---

## 1. Environments

| Env | Branch | `NODE_ENV` | Config template |
|-----|--------|-----------|-----------------|
| Development | any | `development` | `apps/api/.env.example` |
| Staging | `develop` | `staging` | `apps/api/.env.staging.example` |
| Production | `main` | `production` | `apps/api/.env.production.example` |

`validateEnv()` (in `apps/api/src/main.ts`) runs in **strict mode** for
`staging` and `production`: the process exits if any required variable is
missing or malformed (bad `DATABASE_URL` scheme, JWT secret < 32 chars,
`AES_MASTER_KEY` not 64 hex, `JWT_ACCESS_SECRET == JWT_REFRESH_SECRET`, etc.).

**Secrets are never committed.** Inject via the platform secret store:
- Kubernetes: `kubectl -n profytron create secret generic profytron-api-env --from-env-file=apps/api/.env.production` (or external-secrets / sealed-secrets).
- Docker Compose: `env_file: apps/api/.env`.
- See `deploy/k8s/api-secret.example.yaml` for the key list.

---

## 2. Deploy

CI (`.github/workflows/testing.yml` + `security.yml`) must be green:
typecheck, lint, unit + integration tests, build, dependency audit, Trivy,
CodeQL, TruffleHog secret scan, Semgrep.

CD (`.github/workflows/deploy.yml`) is **opt-in**: set repo variable
`DEPLOY_ENABLED=true` and provide `KUBE_CONFIG_STAGING` / `KUBE_CONFIG_PRODUCTION`.

- `develop` → builds image → deploys to **staging**.
- `main` → builds image → deploys to **production** (gate with required
  reviewers on the `production` GitHub Environment).

Rollout is a zero-downtime `RollingUpdate` (`maxUnavailable: 0`,
`deploy/k8s/api-deployment.yaml`). Production deploy auto-rolls-back if the
post-deploy `/health` check fails.

### Manual rollback (target: < 2 min)

```bash
# Kubernetes — previous revision
./scripts/rollback.sh k8s
# Kubernetes — specific revision
./scripts/rollback.sh k8s 42

# Docker Compose — pin a known-good image
API_IMAGE=ghcr.io/ORG/profytron-api:v1.4.2 ./scripts/rollback.sh compose
```

---

## 3. Health & Observability

- **Health endpoint:** `GET /health` reports `database`, `redis`, `queue`,
  `websocket`, and `uptime`. Returns **503** when the database is unreachable
  (so the LB/k8s readiness probe drains the pod). k8s probes: startup (60s
  budget), readiness (10s), liveness (15s).
- **Errors:** Sentry (frontend + backend).
- **Tracing:** OpenTelemetry — set `OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. an OTLP
  collector) to enable; no-op otherwise. `OTEL_SERVICE_NAME` optional.
- **Logs:** Winston → `logs/error.log` + `logs/combined.log` (ship to a log
  aggregator in prod).
- **Metrics to watch:** API P50/P95/P99, DB connections + slow queries, Redis
  memory/evictions/hit-ratio, queue depth + failed jobs (Bull DLQs:
  `trade_execution_dlq`, `agent_dlq`).

---

## 4. Backups & Disaster Recovery

Backups are custom-format `pg_dump` files created by `scripts/db-backup.sh`.

```cron
0  *   * * *   /app/scripts/db-backup.sh hourly    # keep 24
30 2   * * *   /app/scripts/db-backup.sh daily     # keep 14
0  3   * * 0   /app/scripts/db-backup.sh weekly    # keep 8
```

Set `BACKUP_S3_BUCKET` to also push offsite. **Transaction-log / PITR:** enable
WAL archiving (or use the managed provider's PITR, e.g. Neon/RDS).

### Restore

```bash
TARGET_DATABASE_URL=postgres://... CONFIRM=yes \
  ./scripts/db-restore.sh /var/backups/profytron/profytron-daily-XXXX.dump
```

### Verify backups (monthly — a backup you never restored isn't a backup)

```bash
ADMIN_DATABASE_URL=postgres://user:pw@host:5432/postgres \
  ./scripts/backup-verify.sh
```

Restores the latest dump into a scratch DB, runs a sanity query, then drops it.
Wire this to a monthly cron/CI job that alerts on non-zero exit.

**RTO/RPO targets:** RPO ≤ 1h (hourly backups + WAL), RTO ≤ 30m (restore +
redeploy). DB availability target 99.99% — use a managed HA Postgres or a
primary/replica with automatic failover.

---

## 5. Redis Reliability

- Persistence: AOF (`appendfsync everysec`) + RDB snapshots — `deploy/redis.conf`.
- Eviction **disabled** (`noeviction`) so queue jobs / auth state are never
  dropped under memory pressure.
- HA: `docker-compose.ha.yml` runs primary + replica + 3 Sentinels (quorum 2,
  automatic failover). For ioredis Sentinel discovery use
  `{ sentinels: [...], name: 'profymaster' }`.
- WebSocket scaling: the API attaches a **Redis Pub/Sub Socket.IO adapter**
  (`apps/api/src/adapters/redis-io.adapter.ts`) automatically when a real Redis
  URL is configured, so events fan out across all replicas.

---

## 6. Scaling

- API replicas are also BullMQ workers (processors run in-process), so scaling
  the Deployment scales execution throughput. Master-trade polling is guarded
  by a Redis leader-lease (`MasterSyncService`) — only ONE replica fans out
  copies, so no duplicate executions.
- Autoscaling: `deploy/k8s/api-hpa.yaml` (CPU 65% / mem 75%, 3–20 replicas).
- Compose: `docker compose -f docker-compose.prod.yml up -d --scale api=N`
  (nginx round-robins via Docker DNS).

---

## 7. Security & Secret Rotation

- Rate limits: 100 req/min anonymous, 1000 req/min authenticated, Redis-backed
  across replicas.
- Edge: terminate TLS 1.3 + HTTP/2/3 + Brotli at `deploy/nginx.edge.conf`;
  front with Cloudflare (WAF, DDoS, bot, geo).
- **Rotate every 90 days:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, API keys,
  DB passwords.
  - JWT secrets: rotate one at a time; access-token rotation logs users out on
    next refresh (≤ 1h) — schedule off-peak.
  - `AES_MASTER_KEY`: rotating requires **re-encrypting stored broker
    credentials** — run a migration that decrypts with the old key and
    re-encrypts with the new one BEFORE swapping. Never rotate blind.

---

## 8. Incident Quick Reference

| Symptom | First check |
|---------|-------------|
| API 503s | `GET /health` → which dependency is `degraded`? |
| All requests 429 | Rate limiter / Redis up? Check throttler storage |
| WS events missing on some clients | Redis adapter connected? (multi-replica) |
| Queue jobs stuck | Redis up? Check Bull DLQs + worker logs |
| Boot crash-loop in prod | `validateEnv` output — missing/invalid env var |
| Bad deploy | `./scripts/rollback.sh k8s` |
| Data loss/corruption | Restore latest verified backup (§4) |
