# Runbook — Redis unavailable

**Severity:** SEV2

## Symptoms

- `/health.redis` = `degraded`  
- Session / rate-limit / cache anomalies  

## Likely causes

- Upstash/Redis host outage · wrong password · network  

## Immediate actions

1. Check Redis provider status.  
2. Verify Redis env secrets.  
3. Expect users may need re-login; API should still serve if DB up.  

## Verification

- `/health.redis` = `connected`  

## Escalate when

- Auth completely broken > 30 min
