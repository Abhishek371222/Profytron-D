# Auth Completion — Phase 2

**Evidence:** [`../phase1/reports/AUTH_REPORT.md`](../phase1/reports/AUTH_REPORT.md), [`PRODUCT_DEBT.md`](../phase1/reports/PRODUCT_DEBT.md) (`PROD-P1-auth-live_otp`)

| Capability | Status | Notes |
| --- | --- | --- |
| Signup | Launch Ready | Existing register UI |
| Login | Launch Ready | `reset=success` + OAuth detail messaging |
| Forgot password | Launch Ready | CTA/toast wording aligned |
| Reset password | Launch Ready | Missing-token dedicated state |
| Verify email | Launch Ready | No fake demo email; email gate |
| OAuth buttons | Launch Ready | Presence; callback retry UI |
| Session recovery | Launch Ready | Existing idle/expired URL messages |
| Logout | Launch Ready | TopBar + expanded/collapsed Sidebar |
| Live OTP | Deferred | `PROD-P1-auth-live_otp` — policy |

## Changes

- Reset missing token screen; verify email gate; login microcopy; OAuth callback recovery; collapsed sidebar logout
