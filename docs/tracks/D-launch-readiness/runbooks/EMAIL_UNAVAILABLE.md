# Runbook — Email provider unavailable

**Severity:** SEV2

## Symptoms

- OTP / verify / password-reset not arriving  
- Provider bounce errors  

## Immediate actions

1. Check email provider status and API key.  
2. Confirm production sender domain DNS.  
3. Offer support manual verification for blocked beta users if needed.  

## Verification

- Send test OTP to known inbox  

## Escalate when

- Auth fully blocked for new users > 1 hour
