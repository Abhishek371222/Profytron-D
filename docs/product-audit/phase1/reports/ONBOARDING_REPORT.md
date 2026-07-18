# Onboarding Report

**Journey:** Onboarding (`onboarding`)  
**Wall time:** 27755 ms  
**Steps:** 4

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| welcome | /onboarding | Missing | 11147 | 5 | — | page.waitForSelector: Timeout 5000ms exceeded. Call log:   - waiting for locator('body') to be visible     7 × locator resolved to hidden <body class="__variable_0c9267 __variable_694534 font-sans text-body bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground">…</body>     - waiting for" http://127.0.0.1:3000/onboarding/risk" navigation to finish...  |
| risk | /onboarding/risk | Complete | 3977 | 1 | journeys/onboarding/risk.png |  |
| terms | /terms | Complete | 7016 | 1 | journeys/onboarding/terms.png |  |
| risk_disclosure | /risk-disclosure | Complete | 5601 | 1 | journeys/onboarding/risk_disclosure.png |  |

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |
