# Billing Report

**Journey:** Billing & subscriptions (`billing`)  
**Wall time:** 18110 ms  
**Steps:** 6

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| pricing | /pricing | Complete | 3632 | 1 | journeys/billing/pricing.png |  |
| billing | /billing | Complete | 3672 | 1 | journeys/billing/billing.png |  |
| subscriptions | /subscriptions | Complete | 3681 | 1 | journeys/billing/subscriptions.png |  |
| wallet | /wallet | Complete | 3483 | 1 | journeys/billing/wallet.png |  |
| settings_billing | /settings/billing | Complete | 3628 | 1 | journeys/billing/settings_billing.png |  |
| live_checkout | /billing | Blocked | 0 | 0 | — | Real Razorpay/Stripe checkout not exercised |

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |


## Policy skips

Real Razorpay/Stripe checkout is **Blocked**.
