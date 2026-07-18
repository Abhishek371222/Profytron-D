# Error Recovery Report

| Probe | Status | Note | Evidence |
| --- | --- | --- | --- |
| not_found | Complete | 404 / not-found surface reachability | journeys/error_recovery/not-found.png |
| unauthorized_gate | Complete | Unauthed dashboard redirected/gated | journeys/error_recovery/no-jwt-dashboard.png |
| offline | Partial | No dedicated offline banner detected (browser offline set) | journeys/error_recovery/offline.png |

## Journey error_recovery steps

| Step | Path | Status | Note |
| --- | --- | --- | --- |
| not_found | /this-route-does-not-exist-product-audit | Complete | HTTP 404; not-found probe (soft) |
| authed_without_jwt | /dashboard | Complete | Expect redirect or login gate |
