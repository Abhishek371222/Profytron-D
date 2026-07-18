# Onboarding Report

**Journey:** Onboarding (`onboarding`)  
**Wall time:** 25287 ms  
**Steps:** 4

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| welcome | /onboarding | Complete | 6417 | 1 | journeys/onboarding/welcome.png | Welcome shell or redirect to /onboarding/risk — body must stay visible |
| risk | /onboarding/risk | Complete | 5896 | 0 | journeys/onboarding/risk.png |  |
| terms | /terms | Complete | 7298 | 1 | journeys/onboarding/terms.png |  |
| risk_disclosure | /risk-disclosure | Complete | 5659 | 1 | journeys/onboarding/risk_disclosure.png |  |

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |
