# ADR-004: Scheduler owns synchronization work

- **Status:** Accepted
- **Date:** 2026-07-18

## Decision

- Critical: user refresh / trade actions
- High: socket delta apply
- Medium: 5-minute background reconcile (visible tab only)
- Low: risk reconcile after trades
- Idle: reserved for prefetch

Dashboard `refetchInterval` for broker queries removed; `staleTime` raised to 10 minutes.
