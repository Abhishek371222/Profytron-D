# Onboarding Guide — Phase 2

**Evidence:** `PROD-P0-onboarding-welcome`, [`ONBOARDING_REPORT.md`](../phase1/reports/ONBOARDING_REPORT.md)

## Flow

1. `/onboarding` — visible welcome / next-step shell (never a blank hidden body during redirect)
2. `/onboarding/risk` — Risk DNA questionnaire
3. Completion — clear next choice (paper/broker vs strategies), then navigate
4. Terms / risk disclosure remain reachable from copy links

## Rules

- User always knows the next step
- No customer-facing “start API on port …” messages
- Completed onboarding → dashboard; incomplete → risk flow
- Align with existing `onboarding_completed` cookie / user flag (no auth architecture change)
