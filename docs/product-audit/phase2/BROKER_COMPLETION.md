# Broker Completion — Phase 2

**Evidence:** [`BROKER_FLOW_REPORT.md`](../phase1/reports/BROKER_FLOW_REPORT.md), `PROD-P1-broker-live_metaapi`

| Capability | Status | Notes |
| --- | --- | --- |
| Connect CTA / empty | Launch Ready | Existing empty + connect |
| Load error vs empty | Launch Ready | `DashErrorState` + retry |
| Reconnect / disconnect UX | Complete | Existing modal flows |
| Live MetaAPI connect | Deferred | Policy P1 |

## Changes

- Connected-accounts load-error branch (no longer looks like “no accounts”)
