# Master Evidence Index

**Law:** No claim of completion without a row here.  
**Updated:** 2026-08-02

| Claim | Gate | Artifact path / URL | Date | Owner | Status |
|-------|------|---------------------|------|-------|--------|
| Redis shared rate-limit store | Hardening | `apps/api/src/common/throttler-redis.storage.ts` | 2026-08-02 | eng | Code 🟢 — multi-replica load ⬜ |
| Trade signal unique concurrency | Hardening | migration `20260802120000_trade_signal_id_unique` | 2026-08-02 | eng | Code 🟢 — load ⬜ |
| Deposit idempotency unified | Hardening | `payments.service` race path uses PI id | 2026-08-02 | eng | Code 🟢 — stripe log ⬜ |
| Atomic deposit confirm | Hardening | `wallet.service` confirmDeposit txn | 2026-08-02 | eng | Code 🟢 |
| 2FA sealed at rest | Security | `twofa.service.ts` + unit tests pass | 2026-08-02 | eng | Code 🟢 |
| Prod Redis security fail-closed | Security | `redis.service.ts` | 2026-08-02 | eng | Code 🟢 |
| API unit tests green | Testing | `Evidence/testing/api-jest-2026-08-02.md` (133 pass) | 2026-08-02 | eng | 🟢 |
| API health e2e probes | Testing | `apps/api/test/app.e2e-spec.ts` | 2026-08-02 | eng | Code 🟢 |
| Playwright CI smoke | Testing | `apps/web/tests/ci-smoke.spec.ts` + workflow | 2026-08-02 | eng | Code 🟢 — CI run URL ⬜ |
| Lighthouse a11y gate in CI | Perf/A11y | `.github/workflows/lighthouse.yml` | 2026-08-02 | eng | Code 🟢 |
| **Landing LCP median < 4s** | Performance | `Evidence/performance/lcp-median-link.md` → day-13 Lighthouse (median **3927 ms**) | 2026-08-02 | eng | **PASS 🟢** |
| **Prod web deploy** | Operations | `Evidence/operations/prod-deploy-smoke-link.md` (`web-00074-nkc`) | 2026-08-02 | eng | **🟢** |
| **Public smoke 200s** | Operations | same | 2026-08-02 | eng | **🟢** |
| Aaradhya FE residual track eng complete | Engineering | `Evidence/release/aaradhya-fe-engineering-100-link.md` | 2026-08-02 | eng | **10/10 eng scope 🟢** |
| Safari/iOS device session video | QA | | | | ⬜ HOLD device |
| Stripe deposit webhook verified live | Operationally Proven | | | | ⬜ HOLD |
| Razorpay renew + refund verified | Operationally Proven | | | | ⬜ HOLD |
| k6 100/500/1000 | Production Hardened | | | | ⬜ |
| Backup restore date | Reliability | | | | ⬜ |
| Alert fire/recover | Reliability | | | | ⬜ |
| Rollback drill | Release Ready | | | | ⬜ |
| Closed beta cohort goals | Release Ready | | | | ⬜ |

## Score from this index

See [`PROJECT_SCORECARD.md`](./PROJECT_SCORECARD.md): **blended 9.3 / 10** (engineering 9.4 · ops 8.7).  
**Not 10/10 overall** while empty ⬜ rows remain.
