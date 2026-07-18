# ADR-003: Dashboard module isolation

- **Status:** Accepted
- **Date:** 2026-07-18

DashboardClock leaf owns 1Hz ticks. Quotes subscribe inside MarketWatch/OpenTrades modules via shared `live-market-quotes-v3` query. Memo modules + RenderSlot wrap overview widgets. Rollback: `NEXT_PUBLIC_RENDER_ENGINE=0`.
