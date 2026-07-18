# EXIT_CRITERIA — API Audit Phase 1

## Deliverables

- [x] README / IMPLEMENTATION_SUMMARY / EXIT_CRITERIA
- [x] reports/* (inventory, latency, payloads, WS, cache, OpenAPI, priority, …)
- [x] data/* evidence JSON
- [x] diagrams/*

## Knowledge checklist

| Criterion | Status |
|-----------|:------:|
| Every endpoint inventoried | ✅ |
| Latency measured (or skip-documented) | ✅ |
| Payloads measured | ✅ |
| WebSocket events inventoried | ✅ |
| Caches documented | ✅ |
| Guards documented | ✅ |
| DTOs documented | ✅ |
| Priority matrix | ✅ |
| No production behavior change | ✅ (timing flag off by default) |

## Gate

```bash
pnpm api-audit:all
pnpm --filter api build
# artifact test: apps/web/tests/api-audit/phase1-artifacts.spec.ts
```
