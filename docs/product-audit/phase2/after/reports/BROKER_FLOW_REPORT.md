# Broker Flow Report

**Journey:** Broker connection (`broker`)  
**Wall time:** 7384 ms  
**Steps:** 3

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| accounts | /connected-accounts | Complete | 3858 | 1 | journeys/broker/accounts.png |  |
| connect_cta | /connected-accounts | Complete | 3517 | 1 | journeys/broker/connect_cta.png | CTA visibility only |
| live_metaapi | /connected-accounts | Blocked | 0 | 0 | — | Live MetaAPI broker connect not exercised (Phase 1 measure-only) |

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |


## Policy skips

Live MetaAPI connect is **Blocked** — CTA/page reachability only.
