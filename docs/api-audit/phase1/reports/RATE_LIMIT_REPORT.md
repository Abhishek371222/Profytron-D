# RATE_LIMIT_REPORT — API Audit Phase 1

## Default

| Setting | Value |
|---------|-------|
| Window | 60s |
| Limit (anonymous) | 100 |
| Limit (authenticated bump) | 1000 |
| Guard | `AppThrottlerGuard` |

## Per-route @Throttle

- `apps/api/src/common/guards/throttler.guard.ts`: (Throttler import only)
- `apps/api/src/modules/ai/ai.controller.ts`: (Throttler import only)
- `apps/api/src/modules/auth/auth.controller.ts`: (Throttler import only)
- `apps/api/src/modules/coach/coach.controller.ts`: (Throttler import only)
- `apps/api/src/modules/trading/trading.controller.ts`: (Throttler import only)
- `apps/api/src/modules/wallet/wallet.controller.ts`: (Throttler import only)

## Missing protection candidates (heuristic)

- High-cost AI / analytics GETs rely on global throttle only — verify in Phase 2 if abuse evidenced.
- WebSocket namespaces are not HTTP-throttled the same way.
