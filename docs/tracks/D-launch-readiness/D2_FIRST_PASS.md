# D2 — First Pass Results (Security & Secrets)

**Date:** 2026-07-19  
**Scope:** Repo hygiene + inventory + rotation/recovery procedures (no architecture changes)  
**Status:** First pass **complete** with open rotation actions for operators

---

## Pass checklist

| Check | Result |
| --- | :---: |
| Secrets only in Secret Manager / env (app code uses `process.env`) | ✅ |
| No live secrets tracked in git (`git ls-files` on `*.env` / render/vercel env dumps) | ✅ |
| Local secret dumps gitignored (`render.env`, `render-api.env`, `vercel-web.env`, `apps/api/.env`, `firebase-messaging-sw.js`) | ✅ |
| Example env files use placeholders only (`.env.example`) | ✅ |
| Cloud Build / Render wired via secret refs (`cloudbuild-api.yaml` `--set-secrets`) | ✅ |
| Hardcoded Firebase client key in generated SW | ⚠️ Expected for client FCM; file gitignored; regenerate from template |
| Git history clean for named secret dumps (2026-07-19 agent scan) | ✅ [`evidence/D2_GIT_HISTORY_20260719.md`](./evidence/D2_GIT_HISTORY_20260719.md) |
| API keys rotated where appropriate | ⬜ Operator action (see below) — blocked until Render API is healthy |
| Least privilege on service accounts | ⬜ Confirm in GCP/Render console |
| DB credentials scoped (pooler vs direct) | ⚠️ Documented pattern exists; confirm prod roles |
| Credential inventory documented | ✅ [`CREDENTIAL_INVENTORY.md`](./CREDENTIAL_INVENTORY.md) |
| Compromise recovery procedures | ✅ [`SECRET_ROTATION_PLAYBOOK.md`](./SECRET_ROTATION_PLAYBOOK.md) |

---

## Findings (no secret values in this doc)

### P0 — Operator rotation recommended before public beta

Local working copies contain **real** provider credentials (MetaAPI JWT, Razorpay secret, Stripe test key, Firebase private key, etc.) in **gitignored** files. That is correct for git — but anyone with disk/backup access to the machine can read them.

**Action:** Treat as exposed to the workstation. Rotate MetaAPI, Razorpay, Stripe (if ever shared), Firebase admin key, JWT secrets, AES master key **before GA**, and ensure only Secret Manager / host env holds production values.

### P1 — Confirm nothing ever committed historically

Run (owner):

```bash
git log --all --full-history -- "**/render.env" "**/render-api.env" "**/.env" "**/vercel-web.env"
```

If history contains secrets: rotate those keys **immediately** and consider history rewrite or treat repo as compromised for those credentials.

### P2 — Service account least privilege

Verify in GCP / Render / Neon:

- API runtime SA cannot create IAM users or read unrelated secrets  
- DB user is not `superuser`  
- MetaAPI token scopes match trading needs only  

### P3 — Client-visible keys

`NEXT_PUBLIC_*` / Firebase web API keys are public by design. Restrict via Firebase App Check / HTTP referrer where possible.

---

## Explicit non-actions this pass

- Did **not** commit or delete local env files (developer convenience; already ignored).  
- Did **not** rotate live keys from this agent session (requires owner console access).  
- Did **not** change application architecture.

---

## Sign-off

| Role | Status |
| --- | --- |
| Engineering (repo hygiene) | ✅ First pass |
| Ops (rotation in prod consoles) | ⬜ Pending |
| Security (least privilege review) | ⬜ Pending |
