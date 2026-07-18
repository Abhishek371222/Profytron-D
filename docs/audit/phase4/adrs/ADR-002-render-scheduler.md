# ADR-002: Separate Render Scheduler

- **Status:** Accepted
- **Date:** 2026-07-18

RequestScheduler (network/sync) remains for MT5 work. RenderScheduler (`platform/rendering/internal/RenderScheduler.ts`) owns rAF-batched UI metric work and idle lanes. Never merge the two queues.
