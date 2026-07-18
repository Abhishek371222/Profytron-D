# Runbook — API unavailable

**Severity:** SEV1 · **Alert:** API unhealthy / uptime fail

## Symptoms

- `/health` or `/ready` returns 503  
- Users cannot load dashboard / API errors  

## Likely causes

- Database down or connection pool exhausted  
- Bad deploy  
- Host crash / OOM  

## Immediate actions

1. Check `/live` (process) vs `/ready` (DB).  
2. Check Neon status and connection limits.  
3. Check latest deploy; rollback if correlated.  
4. Restart API instance if process hung but DB healthy.  

## Verification

- `/ready` → 200  
- Spot-check login + dashboard  

## Escalate when

- Neon outage > 15 min or data corruption suspected → SEV1 lead + DB owner
