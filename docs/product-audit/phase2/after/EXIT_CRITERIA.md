# Exit Criteria — Product Excellence Phase 1

| # | Criterion | Status |
| ---: | --- | --- |
| 1 | `journeys.json` covers visitor→error_recovery catalog | PASS |
| 2 | Capture scripts exist and skip live broker/checkout/OTP | PASS |
| 3 | `data/journey-results.json` written by harness | PASS |
| 4 | Domain + completeness + debt reports generated | PASS |
| 5 | `pnpm product-audit:all` completes (graceful without JWT/web) | PASS (harness design) |
| 6 | Artifact gate `phase1-artifacts.spec.ts` | See CI / local Playwright |
| 7 | No platform/UI/API/DB/trading/AI app changes | PASS (harness-only) |

## Mission questions answered

1. **Can a visitor reach marketing CTAs?** → `reports/` + visitor journey  
2. **Are auth surfaces reachable?** → AUTH_REPORT (OTP live skipped)  
3. **Onboarding / broker / strategies / coach / billing / settings / marketplace?** → domain reports  
4. **What is Complete vs Partial vs Blocked vs Missing?** → FEATURE_COMPLETENESS  
5. **What is launch debt?** → PRODUCT_DEBT + PRIORITY_MATRIX  
6. **What may Phase 2 fix?** → PHASE2_INPUTS (evidence-only)
