# Runbook — Elevated error rates

**Severity:** SEV1 if user-facing · else SEV2

## Symptoms

- Sentry spike · 5xx rate alert  

## Immediate actions

1. Open Sentry — top issue fingerprint.  
2. Correlate with deploy time (`gitSha` on `/health`).  
3. Rollback if deploy-correlated.  
4. Hotfix only if rollback insufficient and risk understood.  

## Verification

- Error rate returns to baseline · smoke critical journeys  

## Escalate when

- Unknown root cause > 30 min
