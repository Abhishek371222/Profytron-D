# D7 — Load & Resilience Testing

## Goal

Document behavior at ~100 / ~500 / ~1000 concurrent users against API health probes (extend to authed journeys as needed).

## Harness

```bash
# Requires k6 installed: https://k6.io/docs/get-started/installation/
pnpm load:d7:100
pnpm load:d7:500
pnpm load:d7:1000
```

Script: `performance-tests/d7-ladder.js`  
Env: `API_BASE_URL=https://your-api-host`

Legacy scripts: `performance-tests/load-test.js`, `api-performance-test.js`

## Pass criteria (suggested)

| Ladder | http_req_failed | p95 |
| --- | --- | --- |
| 100 | < 5% | < 2s on `/health` |
| 500 | < 5% | < 2s |
| 1000 | < 5% or documented ceiling | note saturation |

## Evidence

Save k6 summary JSON/stdout to `docs/tracks/D-launch-readiness/evidence/D7_LOAD_<ladder>_<YYYYMMDD>.txt`

## Exit

⬜ At least 100 VU evidence · ideally 500/1000 · V1 gate 11
