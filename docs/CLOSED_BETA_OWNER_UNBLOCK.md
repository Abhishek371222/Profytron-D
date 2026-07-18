# Owner unblock list — closed beta (2026-07-19)

Agent ran Weeks 1–2 as far as possible without your console logins. **These require you:**

## P0 — Restore production API (blocks everything)

1. Open [Render](https://dashboard.render.com) → service behind `profytron-api.onrender.com`
2. Check: suspended / free-tier sleep / crash loop / failed deploy
3. Manual deploy or restart until:
   - `GET https://profytron-api.onrender.com/live` → 200
   - `GET …/ready` → 200
   - `GET …/health` → 200 (ok or degraded OK)
4. Tell the agent (or re-run) — UAT + load resume immediately after

## P0 — Ship `/status` on web

Repo has `apps/web/src/app/status/page.tsx` but prod returns **404**. Redeploy web (Vercel / host) so `https://www.profytron.com/status` works.

## P1 — Secret rotation (Week 1)

In provider consoles (not git): rotate MetaAPI, payments, JWT, AES if workstation copies are treated as exposed. Follow [`SECRET_ROTATION_PLAYBOOK.md`](./tracks/D-launch-readiness/SECRET_ROTATION_PLAYBOOK.md).

## P1 — Live UAT (after API up)

Manual: MetaAPI connect, payment test checkout, email OTP inbox. Evidence templates already in track docs.

## P2 — Invite cohort (Week 3)

1. Fill emails in [`CLOSED_BETA_INVITE_LIST.md`](./CLOSED_BETA_INVITE_LIST.md)
2. Set `BETA_ALLOWLIST_EMAILS` on Render API env
3. Send invites — agent cannot invent or email your users

## Already done by agent

| Item | Evidence |
| --- | --- |
| Closed beta docs + playbook + BETA_LOG | `docs/CLOSED_BETA_PLAYBOOK.md`, `docs/BETA_LOG.md` |
| Git secret-history scan | `evidence/D2_GIT_HISTORY_20260719.md` |
| Health probe (failed = real blocker) | `evidence/D1_HEALTH_PROBE_20260719.md` |
| k6 installed + ladder 100 against prod | `evidence/D7_LOAD_100_*` |
| Invite worksheet | `docs/CLOSED_BETA_INVITE_LIST.md` |
| Operator run cheat sheet | `tracks/D-launch-readiness/OPERATOR_RUN.md` |
