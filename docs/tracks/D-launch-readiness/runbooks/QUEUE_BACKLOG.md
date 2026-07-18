# Runbook — Queue backlog

**Severity:** SEV2

## Symptoms

- `/health.queue` degraded · trades delayed · Bull waiting jobs grow  

## Immediate actions

1. Check Redis + worker/API process.  
2. Inspect `trade_execution` failed jobs.  
3. Redeploy/restart workers if stuck; redrive carefully.  

## Verification

- Queue healthy · job lag decreasing  

## Escalate when

- Live order placement delayed in market hours
