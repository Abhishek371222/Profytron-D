# Runbook — Database unavailable

**Severity:** SEV1

## Symptoms

- `/health.database` = `unavailable`  
- Prisma connection errors in logs  

## Likely causes

- Neon outage · credentials rotated · pool saturation · network  

## Immediate actions

1. Confirm Neon status page.  
2. Verify `DATABASE_URL` / `DIRECT_URL` in Secret Manager (no commit dumps).  
3. If destroyed primary: PITR / branch restore per [`D1_BACKUP_RESTORE.md`](../D1_BACKUP_RESTORE.md).  
4. Point API at restored URL; `prisma migrate deploy` if needed.  

## Verification

- `/ready` 200 · sample read query succeeds  

## Escalate when

- Restore required or RPO breach risk
