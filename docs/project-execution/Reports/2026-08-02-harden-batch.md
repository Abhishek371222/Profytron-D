# 2026-08-02 engineering harden batch

## Changes shipped (code)

1. **Redis throttler storage** — multi-instance rate limits  
2. **Trade `signalId` unique** — concurrent execution de-dupe (+ P2002 race handle)  
3. **Deposit confirm atomic** + unified PaymentIntent idempotency key  
4. **2FA secrets encrypted / backup codes hashed** at rest (legacy plaintext still verifies)  
5. **Prod Redis security writes fail-closed** (no multi-instance memory mirror)  
6. **API e2e probe suite** for `/`, `/live`, `/ready`, `/health`  
7. **Playwright CI smoke job** + **Lighthouse hard gate**  
8. **Project Execution control center** (evidence-gated path to 10/10)

## Validation still required (not automatic 10/10)

- Apply Prisma migration in each environment  
- Capture green CI artifacts into `Evidence/`  
- Staging Stripe/Razorpay end-to-end  
- k6 load ladder evidence  
- Backup restore + rollback drill  
- Closed beta objectives  

See `MASTER_EVIDENCE_INDEX.md`.
