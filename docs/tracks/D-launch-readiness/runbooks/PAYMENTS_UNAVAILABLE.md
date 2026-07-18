# Runbook — Payment provider unavailable

**Severity:** SEV2

## Symptoms

- Checkout / webhook failures · Stripe/Razorpay errors in Sentry  

## Immediate actions

1. Check Stripe / Razorpay status.  
2. Pause promotional “upgrade” pushes if needed.  
3. Do not retry webhooks aggressively.  

## Verification

- Test invoice/checkout in staging · webhooks 2xx  

## Escalate when

- Money captured but entitlement not granted
