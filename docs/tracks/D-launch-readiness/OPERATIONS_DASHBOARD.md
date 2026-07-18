# Operations Dashboard

**Audience:** On-call / operator who has never seen Profytron.  
**Start here** every shift and before beta invites.  
**Current phase:** Closed beta (20–50 users) — not public GA.  
**Blocker (2026-07-19):** Production API unreachable + `/status` 404 — see [`evidence/D1_HEALTH_PROBE_20260719.md`](./evidence/D1_HEALTH_PROBE_20260719.md).  
**Track D baseline:** [`TRACK_D_BASELINE.md`](./TRACK_D_BASELINE.md)  
**Playbook:** [`CLOSED_BETA_PLAYBOOK.md`](../../CLOSED_BETA_PLAYBOOK.md) · **Daily log:** [`BETA_LOG.md`](../../BETA_LOG.md) · **Owner unblock:** [`CLOSED_BETA_OWNER_UNBLOCK.md`](../../CLOSED_BETA_OWNER_UNBLOCK.md)

## Quick links

| Item | Link / command |
| --- | --- |
| Closed beta playbook | [`CLOSED_BETA_PLAYBOOK.md`](../../CLOSED_BETA_PLAYBOOK.md) |
| Daily beta log | [`BETA_LOG.md`](../../BETA_LOG.md) |
| Public status | [`/status`](/status) (web) |
| Live / Ready / Health | `GET <API>/live` · `/ready` · `/health` |
| D1–D8 packs | [`README.md`](./README.md) |
| UAT evidence | [`evidence/`](./evidence/) |
| Secrets | [`D2_FIRST_PASS.md`](./D2_FIRST_PASS.md) |
| V1 gates | [`../../V1_LAUNCH_CRITERIA.md`](../../V1_LAUNCH_CRITERIA.md) |
| Weekly log | [`WEEKLY_LOG.md`](./WEEKLY_LOG.md) |

## Shift checklist

| Area | Status | Notes |
| --- | :---: | --- |
| Deployment `gitSha` | ⬜ | |
| `/live` `/ready` `/health` | ⬜ | |
| `/status` page | ⬜ | |
| Monitoring / Sentry | ⬜ | |
| Backup / restore date | ⬜ | |
| D2 secret rotation | ⬜ | |
| D4 MetaAPI UAT evidence | ⬜ | |
| D3 Payments UAT evidence | ⬜ | |
| D5 Email UAT evidence | ⬜ | |
| D7 load evidence | ⬜ | |
| Beta allowlist set | ⬜ | `BETA_ALLOWLIST_EMAILS` |
| Feedback channel | ⬜ | |

## Remaining blockers (operator)

Engineering baseline for Track D is **complete**. Remaining work is live proof + host wiring — see [`TRACK_D_BASELINE.md`](./TRACK_D_BASELINE.md).

## Philosophy

Detect → Diagnose → Recover → Document. Controlled beta before GA. Insights before Track B.
