# Settings Report

**Journey:** Settings (`settings`)  
**Wall time:** 26214 ms  
**Steps:** 7

| Step | Path | Status | ms | Console errs | Evidence | Note |
| --- | --- | --- | --- | --- | --- | --- |
| root | /settings | Complete | 3581 | 0 | journeys/settings/root.png |  |
| profile | /settings/profile | Complete | 3903 | 1 | journeys/settings/profile.png |  |
| security | /settings/security | Complete | 3742 | 1 | journeys/settings/security.png |  |
| notifications | /settings/notifications | Complete | 3570 | 1 | journeys/settings/notifications.png |  |
| trading | /settings/trading | Complete | 3677 | 1 | journeys/settings/trading.png |  |
| api_keys | /settings/api-keys | Complete | 3639 | 1 | journeys/settings/api_keys.png |  |
| support | /settings/support | Complete | 4074 | 1 | journeys/settings/support.png |  |

## Classification legend

| Status | Meaning |
| --- | --- |
| Complete | Reachability + expect matched |
| Partial | Reachable; soft match or incomplete UI signal |
| Blocked | Intentionally skipped (live broker/payment/OTP/AI) or missing JWT |
| Missing | Navigation/probe failed |
