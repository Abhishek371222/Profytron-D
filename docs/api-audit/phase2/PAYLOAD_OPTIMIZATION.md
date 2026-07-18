# PAYLOAD_OPTIMIZATION — Phase 2

**Evidence:** Phase 1 largest payload `GET /v1/market/news` (~36 527 B)

## Before → After

| Aspect | Before | After |
|--------|--------|-------|
| Cache | get + set (stampede risk) | `redis.cached` single-flight TTL 120s |
| Logo images | Often kept as `image` URL | Non-article logos forced to `null` (field retained) |
| Summary | Full Finnhub text | Same field, capped at **480** chars |
| Item count | 60 | 60 (unchanged) |
| Response keys | category, count, items[], source, serverTime | **unchanged** |

No fields removed. Clients still receive the same JSON schema.
