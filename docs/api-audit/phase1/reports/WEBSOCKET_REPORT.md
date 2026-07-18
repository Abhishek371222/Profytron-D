# WEBSOCKET_REPORT — API Audit Phase 1

Adapter: Redis IO (`apps/api/src/adapters/redis-io.adapter.ts`).

## Gateways

| Namespace | File | Client events | Server emits |
|-----------|------|---------------|--------------|
| account-snapshot | `apps/api/src/modules/broker/account-snapshot.gateway.ts` | — | — |
| coach | `apps/api/src/modules/coach/coach.gateway.ts` | join_conversation, typing | typing |
| trading | `apps/api/src/modules/trading/trading.gateway.ts` | subscribe_prices, unsubscribe_prices | price_update |

## Live connect smoke

- Skipped: socket.io-client not installed in root

## Backpressure / duplicates

Not instrumented in Phase 1 beyond static emit inventory. Phase 2 may add counters if Priority Matrix escalates.
