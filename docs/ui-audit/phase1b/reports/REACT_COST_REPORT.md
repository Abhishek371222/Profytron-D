# React Cost Report

Phase 1B records hydration/nav proxies from Navigation Timing + settled shell flags.

| Route | DCL ms | Load ms | Settled main | aria-busy |
| --- | --- | --- | --- | --- |
| about | 1617 | 2343 | yes | no |
| about | 7243 | 7853 | yes | no |
| about | 1731 | 3204 | yes | no |
| admin-agents | 328 | 0 | no | no |
| admin-agents | 0 | 0 | no | no |
| admin-agents | 318 | 0 | no | no |
| admin-coach | 305 | 0 | no | no |
| admin-coach | 303 | 0 | no | no |
| admin-coach | 784 | 0 | no | no |
| admin-kyc | 240 | 0 | no | no |
| admin-kyc | 175 | 0 | no | no |
| admin-kyc | 303 | 0 | no | no |
| admin-strategies | 688 | 0 | no | no |
| admin-strategies | 306 | 0 | no | no |
| admin-strategies | 207 | 0 | no | no |
| admin-system | 451 | 0 | no | no |
| admin-system | 300 | 0 | no | no |
| admin-system | 330 | 0 | no | no |
| admin-users | 332 | 0 | no | no |
| admin-users | 194 | 0 | no | no |
| admin-users | 173 | 0 | no | no |
| admin | 321 | 978 | no | no |
| admin | 307 | 971 | no | no |
| admin | 323 | 995 | no | no |
| affiliate-best | 294 | 0 | no | no |
| affiliate-best | 304 | 0 | no | no |
| affiliate-best | 823 | 0 | no | no |
| affiliate | 332 | 0 | no | no |
| affiliate | 175 | 0 | no | no |
| affiliate | 299 | 0 | no | no |
| alpha-coach | 169 | 0 | no | no |
| alpha-coach | 1591 | 2652 | no | no |
| alpha-coach | 339 | 0 | no | no |
| analytics-global | 170 | 0 | no | no |
| analytics-global | 297 | 0 | no | no |
| analytics-global | 613 | 0 | no | no |
| analytics-performance | 331 | 996 | no | no |
| analytics-performance | 296 | 978 | no | no |
| analytics-performance | 167 | 969 | no | no |
| analytics-risk | 383 | 0 | no | no |

Component rerender histograms require an optional React Profiler bridge (not injected into product builds). Documented gap unless `NEXT_PUBLIC_PLATFORM_METRICS=1` commit marks appear in console capture.
