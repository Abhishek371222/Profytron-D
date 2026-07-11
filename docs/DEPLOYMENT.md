# Deployment

Production operations live primarily in [RUNBOOK.md](./RUNBOOK.md). This page is the short index for deploy assets and common entry points.

## Prerequisites

- Green CI: `.github/workflows/testing.yml` and `security.yml`
- Valid production env (see `apps/api/.env.example` and platform secret store)
- PostgreSQL + Redis reachable from API replicas

## Deploy paths

| Path | When to use |
|------|-------------|
| Kubernetes (`deploy/k8s/`) | Primary CD via `.github/workflows/deploy.yml` when `DEPLOY_ENABLED=true` |
| Docker Compose (`docker-compose.prod.yml`) | Self-hosted / VM deployments |
| `render.yaml` / `vercel.json` | Platform-specific hosting for API/web as configured |

## Edge & load balancing

- `deploy/nginx.conf`, `deploy/nginx.prod.conf`, `deploy/nginx.edge.conf`
- `deploy/Caddyfile`
- Redis HA: `docker-compose.ha.yml` + `deploy/redis.conf`

## Scaling

API replicas also run Bull processors in-process. Scale replicas to increase execution throughput:

```bash
docker compose -f docker-compose.prod.yml up -d --scale api=4
```

Copy-trading specifics: [COPY_TRADING_ARCHITECTURE.md](./COPY_TRADING_ARCHITECTURE.md).

## Rollback & DR

Use [RUNBOOK.md](./RUNBOOK.md) sections on rollback, backups (`scripts/db-backup.sh`), restore, and incident checks (`GET /health`).

## Health

`GET /health` reports database, redis, queue, websocket, and uptime. Returns **503** when the database is unreachable so load balancers can drain unhealthy instances.
