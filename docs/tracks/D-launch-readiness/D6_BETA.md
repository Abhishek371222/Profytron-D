# D6 — Closed Beta

## Goal

20–50 real users, invite-gated, feedback loop, Insights-driven learnings — **not** public GA.

**Operator home:** [`CLOSED_BETA_PLAYBOOK.md`](../../CLOSED_BETA_PLAYBOOK.md) (Weeks 1–3 + discovery questions + Track B gates)  
**Daily log:** [`BETA_LOG.md`](../../BETA_LOG.md)

## Engineering shipped

| Control | How |
| --- | --- |
| Invite allowlist | Set `BETA_ALLOWLIST_EMAILS=a@x.com,b@y.com` on API |
| Empty allowlist | Open registration (default) |
| Applies to | Email/password register + Google/GitHub new users |

Documented in `apps/api/.env.example`.

## Cohort ops checklist

| # | Item | Status |
| ---: | --- | :---: |
| 1 | Finalize 20–50 emails | ⬜ |
| 2 | Set `BETA_ALLOWLIST_EMAILS` in staging/prod | ⬜ |
| 3 | Feedback channel (email alias / Discord / form) | ⬜ |
| 4 | Success criteria (activation + Coach WAU) | ⬜ |
| 5 | Bug triage owner | ⬜ |
| 6 | Watch Coach Insights + activation funnel weekly | ⬜ |

## Success criteria (suggested)

- ≥70% of cohort complete broker connect within 7 days  
- ≥50% ask Alpha Coach ≥1 question  
- SEV1 incidents = 0 during beta week 1  
- Insights review decides Track B start  

## Exit

⬜ Cohort live · V1 gate 13 · then open Track B from evidence ([`CLOSED_BETA_PLAYBOOK.md`](../../CLOSED_BETA_PLAYBOOK.md) gates)
