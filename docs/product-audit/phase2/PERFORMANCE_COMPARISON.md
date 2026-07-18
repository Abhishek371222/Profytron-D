# Performance Comparison — Phase 2

Lab product-audit journey rates (not production analytics).

| Metric | Phase 1 freeze (`before/`) | Phase 2 after (`after/`) |
| --- | ---: | ---: |
| JWT | yes | yes |
| Steps | 44 | 45 (+ logout) |
| Complete | 39 | **40** |
| Partial | 1 | 2 |
| Blocked (policy) | 3 | 3 |
| Missing | **1** (P0 onboarding) | **0** |
| Lab success rate | ~0.889 | **~0.902** |

## Verdict

P0 Missing eliminated. Policy Blocked (OTP / MetaAPI / checkout) unchanged by design. Offline probe may remain Partial depending on banner visibility under forced offline (product banner ships in dashboard shell).
