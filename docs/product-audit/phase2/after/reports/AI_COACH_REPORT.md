# AI Coach Report

**Journey:** AI Coach (`ai_coach`)  
**Wall time:** 7177 ms  
**Steps:** 3

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| open | /alpha-coach | Complete | 3636 | 1 | journeys/ai_coach/open.png |  |
| input | /alpha-coach | Complete | 3533 | 1 | journeys/ai_coach/input.png | Composer presence |
| live_stream | /alpha-coach | Partial | 0 | 0 | — | Live model streaming not exercised (keys/network) |

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |


## Policy skips

Live model streaming classified **Partial** when not exercised.
