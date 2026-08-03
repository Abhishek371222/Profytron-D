# Master Risk Register

| ID | Risk | Severity | Mitigation (status) | Residual |
|----|------|----------|---------------------|----------|
| R1 | Multi-instance rate limit bypass | High | Redis throttler storage shipped 2026-08-02 | Prove under 2+ Cloud Run revisions |
| R2 | Double trade on concurrent signal | High | `signalId` unique + race-safe create | Apply migration prod; verify with load |
| R3 | Dual deposit idempotency keys | High | Race path now uses PaymentIntent id | Monitor legacy `stripe_deposit_*` rows |
| R4 | 2FA secrets at rest | High | AES-GCM + hashed backup codes | Re-encrypt legacy rows on next 2FA login/action optional |
| R5 | Security redis in-memory split brain | High | Prod fail-closed security `set` | Ensure Redis HA SLO |
| R6 | Playwright not in CI | Medium | CI smoke job added | Expand beyond smoke |
| R7 | Lighthouse non-blocking | Medium | Workflow now fails on hard asserts | Tune if flaky |
| R8 | Withdrawals not real bank rails | High | Ledger-only still true | Product decision + payout integration |
| R9 | Ops evidence empty | High | Control center created | Fill Evidence/ |
| R10 | AI/backtest services thin | Medium | Out of launch money path | Prefer coach Nest path for v1 |

Update severity only when evidence land or new regression found.
