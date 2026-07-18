# Runbook — MetaAPI degraded

**Severity:** SEV2

## Symptoms

- Broker sync errors · Connected Accounts health warn  
- `/health.metaApi` still `configured` (by design)  

## Likely causes

- MetaAPI outage · token expiry · account deploy pending  

## Immediate actions

1. Check MetaAPI status.  
2. Do **not** fail-kill API health for vendor blips.  
3. Rotate token only if auth errors (see D2 playbook).  
4. Communicate “trading sync delayed” to users if prolonged.  

## Verification

- Test account sync succeeds · consecutive failure counters drop  

## Escalate when

- All live accounts stalled > 30 min during market hours
