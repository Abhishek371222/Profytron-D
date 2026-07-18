# Owner unblock list — closed beta (2026-07-19)

**Canonical host:** Google Cloud Run — see [`tracks/D-launch-readiness/GCP_ENDPOINTS.md`](./tracks/D-launch-readiness/GCP_ENDPOINTS.md).  
Do **not** use Render (`profytron-api.onrender.com`) for production.

## P0 — Confirm GCP API + web healthy after Cloud Build

```text
GET https://api-y4zmug7lwa-el.a.run.app/live
GET https://api-y4zmug7lwa-el.a.run.app/ready
GET https://api-y4zmug7lwa-el.a.run.app/health
GET https://www.profytron.com/status
```

Deploy is automatic on push to `main` (triggers `deploy-api` / `deploy-web`), or:

```powershell
.\deploy\gcp\scripts\deploy.ps1 -Service api
.\deploy\gcp\scripts\deploy.ps1 -Service web
```

## P1 — Secret rotation (Week 1)

Rotate via **GCP Secret Manager** + provider consoles. Follow [`SECRET_ROTATION_PLAYBOOK.md`](./tracks/D-launch-readiness/SECRET_ROTATION_PLAYBOOK.md).

## P1 — Live UAT (after API up with /live /ready)

Manual: MetaAPI connect, payment test checkout, email OTP inbox.

## P2 — Invite cohort (Week 3)

1. Fill emails in [`CLOSED_BETA_INVITE_LIST.md`](./CLOSED_BETA_INVITE_LIST.md)
2. Set `BETA_ALLOWLIST_EMAILS` in Secret Manager / Cloud Run env for `api`
3. Send invites

## Already done

| Item | Notes |
| --- | --- |
| Pushed to `main` | Triggers Cloud Build in `asia-south1` |
| Fixed web Docker `@profytron/ai-coach` | commit `a9c02da` |
| Closed beta docs | playbook + BETA_LOG + invite worksheet |
| GCP endpoints doc | `GCP_ENDPOINTS.md` |
