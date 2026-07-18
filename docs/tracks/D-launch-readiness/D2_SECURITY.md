# D2 — Security

**Execution order:** 🥇 First (see [`EXECUTION_ORDER.md`](./EXECUTION_ORDER.md))  
**First pass:** [`D2_FIRST_PASS.md`](./D2_FIRST_PASS.md)

## Scope

- Secrets in Secret Manager / env only  
- No secrets in the repository  
- API key rotation where appropriate  
- Least privilege on service accounts  
- Database credentials scoped correctly  
- MetaAPI, Razorpay/Stripe, email, OAuth credentials documented + validated  
- Recovery procedures for credential compromise  

## Artifacts

| Doc | Purpose |
| --- | --- |
| [`D2_FIRST_PASS.md`](./D2_FIRST_PASS.md) | Scan results + open ops actions |
| [`CREDENTIAL_INVENTORY.md`](./CREDENTIAL_INVENTORY.md) | Names-only inventory |
| [`SECRET_ROTATION_PLAYBOOK.md`](./SECRET_ROTATION_PLAYBOOK.md) | Rotate / recover |

## Remaining before D2 “closed”

- [ ] Owner rotates high-value keys for beta/prod  
- [ ] Confirm no secrets in git history  
- [ ] GCP/Render/Neon least-privilege sign-off  
- [ ] V1 security checklist (gate 10) signed
