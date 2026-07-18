# Health / status probe — 2026-07-19

**Environment:** production  
**API:** `https://profytron-api.onrender.com`  
**Web:** `https://www.profytron.com`

## Results

| Endpoint | Result |
| --- | --- |
| `GET /live` | **FAIL** — timeout 60s (0 bytes) |
| `GET /ready` | **FAIL** — timeout 60s (0 bytes) |
| `GET /health` | **FAIL** — timeout 90s (0 bytes) |
| `GET https://www.profytron.com/` | **PASS** — HTTP 200 |
| `GET https://www.profytron.com/status` | **FAIL** — HTTP 404 (route exists in repo `apps/web/src/app/status/page.tsx` — prod web likely missing deploy) |

## Pass/Fail

**Fail** — API unreachable; public status page not live.

## Blockers (owner)

1. Wake / redeploy Render API service `profytron-api` (likely spun down or crash-looping).  
2. Redeploy web so `/status` ships.  
3. Re-run this probe, then resume MetaAPI / Payments / Email UAT.

## Agent actions taken

- Documented evidence  
- Did **not** run live UAT against a dead API  
- Did **not** proceed to load:500 / 1000  
