# Secret rotation & compromise recovery

Operational playbook — no architecture change required.

## If a credential may be compromised

1. **Revoke / rotate** at the provider (MetaAPI, Stripe, Razorpay, OAuth, Firebase, Neon, email).  
2. **Update** Secret Manager / Render / Vercel / Cloud Run secrets.  
3. **Redeploy** API (+ workers) so new env is loaded.  
4. **Invalidate** sessions if JWT secrets rotated (users re-login).  
5. **Audit** access logs for the exposure window.  
6. **Record** in [`WEEKLY_LOG.md`](./WEEKLY_LOG.md): what, when, who.

## JWT / AES special cases

| Secret | Notes |
| --- | --- |
| `JWT_*` | Prefer brief dual-accept window if app supports it; otherwise force logout. |
| `AES_MASTER_KEY` | Do not rotate casually — requires decrypt/re-encrypt plan for encrypted columns. |

## Safe local development

- Use placeholders from `.env.example`.  
- Never commit `render.env`, `*-api.env`, or real `.env`.  
- Prefer Secret Manager sync scripts over copying prod secrets to laptops for “debugging.”

## Quarterly hygiene

- [ ] Rotate high-value tokens (MetaAPI, payment secrets)  
- [ ] Re-check `.gitignore` covers new dump filenames  
- [ ] Confirm CI uses placeholders only  
- [ ] Confirm production keys are **live** where required (Stripe `sk_live_`, etc.)
