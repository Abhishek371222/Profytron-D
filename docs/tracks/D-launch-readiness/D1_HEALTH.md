# D1.1 — Health & Readiness

## Endpoints (API)

| Path | Also | Purpose | Fail condition |
| --- | --- | --- | --- |
| `GET /live` | `/v1/live` | Liveness — process up | Never fails on deps |
| `GET /ready` | `/v1/ready` | Readiness — accept traffic | **503** if DB unavailable |
| `GET /health` | `/v1/health` | Dependency snapshot | **503** if DB unavailable; **200 + degraded** if Redis/queue/WS soft-fail |

Code: `apps/api/src/app.controller.ts` · prefix exclude: `apps/api/src/app.setup.ts`

## Checks included in `/health`

| Dependency | Field | Behavior |
| --- | --- | --- |
| Postgres | `database` | `connected` \| `unavailable` — **critical** |
| Redis | `redis` | `connected` \| `degraded` — soft |
| Bull trade queue | `queue` | `healthy` \| `degraded` — soft |
| Trading websocket | `websocket` | `healthy` \| `degraded` — soft |
| MetaAPI | `metaApi` | `configured` \| `not_configured` — **never hard-fails** (vendor outage ≠ process death) |

Also returns: `uptime`, `timestamp`, `version`, `gitSha` (Render commit when present).

## Response states

### Healthy (`status: "ok"`, HTTP 200)

```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "queue": "healthy",
  "websocket": "healthy",
  "metaApi": "configured"
}
```

### Degraded (`status: "degraded"`, HTTP 200)

DB up; Redis and/or queue and/or websocket soft-fail. Continue serving; investigate non-critical deps.

### Unhealthy / not ready (`status: "unhealthy"` or `not_ready`, HTTP 503)

Database unavailable. Load balancer / orchestrator should stop sending traffic (`/ready` and `/health`).

### Live always OK (`status: "ok"`, HTTP 200)

Use for container restart policies — do not tie liveness to DB.

## Probe recommendations (Render / Cloud Run / K8s)

| Probe | Path | Expect |
| --- | --- | --- |
| Liveness | `/live` | 200 |
| Readiness | `/ready` | 200 |
| Deep check / uptime robot | `/health` | 200 (alert on 503 or sustained `degraded`) |

## Verification (operator)

```bash
curl -sS https://<API_HOST>/live
curl -sS https://<API_HOST>/ready
curl -sS https://<API_HOST>/health
```

Record results in [`WEEKLY_LOG.md`](./WEEKLY_LOG.md).
