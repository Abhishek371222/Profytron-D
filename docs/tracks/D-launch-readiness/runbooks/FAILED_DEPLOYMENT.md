# Runbook — Failed deployment

**Severity:** SEV1

## Symptoms

- Deploy pipeline red · new revision fails health · traffic errors after release  

## Immediate actions

1. Rollback to previous known-good release on host.  
2. Confirm `/live` + `/ready` on rolled-back revision.  
3. Freeze further deploys until RCA.  

## Verification

- Smoke: login, dashboard, health ok  

## Escalate when

- Rollback also unhealthy (infra/data issue)
