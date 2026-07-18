# WEBSOCKET_OPTIMIZATION — Phase 2

**Locks:** No WebSocket contract / event name / payload schema changes.

## Before

`TradingGateway.broadcastPrices` always emitted to `market_prices`, even if the same snapshot object was re-broadcast.

## After

Skip emit when `prices === lastPriceSnapshot` (reference equality). Event name `price_update` and payload shape unchanged.

## Other gateways

`coach` / `account-snapshot`: no duplicate-emission bug measured in Phase 1 — no code change.
