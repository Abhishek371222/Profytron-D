# PRIORITY_MATRIX — API Audit Phase 1

| ID | Sev | Finding | Phase 2 |
|----|-----|---------|---------|
| API-P2-OPENAPI | P2 | 119 inventory routes missing from OpenAPI doc (or docs disabled) | Improve @Api* coverage in non-prod swagger |
| API-P1-N1-CHATTY | P1 | Cross-ref DB Phase 2: Prisma RTT + sequential loops amplify API latency | Reuse DB batching; avoid new chatty includes |
| API-P2-PAGINATION | P2 | Mixed pagination styles across 26 files (cursor/offset/take) | Standardize list contracts only with explicit versioning (Phase 2+) |

## Untouched recommendation

Auth login/register, trading execution endpoints, sync engine, and WebSocket contracts: **do not change** without new evidence + explicit Phase 2 scope.
