# Closed Beta Playbook

**Launch type:** Closed beta — **not** public.  
**Cohort size:** 20–50 carefully selected users.  
**Current phase:** Operator Weeks 1–3 → invite → observe 2–4 weeks → evidence-gated Track B.  

**Daily log:** [`BETA_LOG.md`](./BETA_LOG.md)  
**Owner unblock (P0):** [`CLOSED_BETA_OWNER_UNBLOCK.md`](./CLOSED_BETA_OWNER_UNBLOCK.md)  
**Invite roster:** [`CLOSED_BETA_INVITE_LIST.md`](./CLOSED_BETA_INVITE_LIST.md)  
**Ops home:** [`tracks/D-launch-readiness/OPERATIONS_DASHBOARD.md`](./tracks/D-launch-readiness/OPERATIONS_DASHBOARD.md)  
**Eng baseline:** [`tracks/D-launch-readiness/TRACK_D_BASELINE.md`](./tracks/D-launch-readiness/TRACK_D_BASELINE.md)  
**v1 gates:** [`V1_LAUNCH_CRITERIA.md`](./V1_LAUNCH_CRITERIA.md)

---

## Principles

| Do | Don’t |
| --- | --- |
| Invite traders you know, friends, a few professionals, a few beginners | Invite hundreds / public GA |
| Ask discovery questions | Ask only “Do you like it?” |
| Collect 2–4 weeks of data before ranking builds | Ship Feature A/B/C the day each user asks |
| Start Track B when evidence says so | Start Track B on a calendar date |
| Log every day in BETA_LOG | Rely on memory months later |

---

## Week 1 — Security + live UAT

| Day focus | Work | Evidence home |
| --- | --- | --- |
| Secrets | Rotate production secrets; verify least privilege | [`tracks/D-launch-readiness/D2_FIRST_PASS.md`](./tracks/D-launch-readiness/D2_FIRST_PASS.md) · [`SECRET_ROTATION_PLAYBOOK.md`](./tracks/D-launch-readiness/SECRET_ROTATION_PLAYBOOK.md) |
| MetaAPI | Run live MetaAPI UAT | [`D4_METAAPI.md`](./tracks/D-launch-readiness/D4_METAAPI.md) → `evidence/` |
| Payments | Run payments UAT (test or live keys) | [`D3_PAYMENTS.md`](./tracks/D-launch-readiness/D3_PAYMENTS.md) → `evidence/` |
| Email / OTP | Run production email + OTP UAT | [`D5_EMAIL.md`](./tracks/D-launch-readiness/D5_EMAIL.md) → `evidence/` |

Also: curl `/live` `/ready` `/health`; confirm `/status`; note results in BETA_LOG.

---

## Week 2 — Load + stabilize

| Step | Command / action |
| --- | --- |
| 1 | `API_BASE_URL=https://<api> pnpm load:d7:100` |
| 2 | Fix anything discovered (bugs only — not new features) |
| 3 | `pnpm load:d7:500` |
| 4 | Monitor errors, latency, sync; optional `pnpm load:d7:1000` when stable |
| 5 | Save stdout/summary under `docs/tracks/D-launch-readiness/evidence/` |

Harness: [`D7_LOAD.md`](./tracks/D-launch-readiness/D7_LOAD.md)

---

## Week 3 — Invite 20–50

1. Finalize invite list (mix experience levels).  
2. Set API env: `BETA_ALLOWLIST_EMAILS=a@x.com,b@y.com,...` (empty = open registration — do **not** leave empty in closed beta).  
3. Confirm feedback channel (email alias / Discord / form) and bug triage owner.  
4. Send invites; point users to `/status` and support if needed.  
5. Start daily [`BETA_LOG.md`](./BETA_LOG.md) entries with real traffic.

Detail: [`tracks/D-launch-readiness/D6_BETA.md`](./tracks/D-launch-readiness/D6_BETA.md)  
Invite roster worksheet: [`CLOSED_BETA_INVITE_LIST.md`](./CLOSED_BETA_INVITE_LIST.md)

---

## Discovery questions (use these)

- Where did you get confused?  
- What took longer than expected?  
- What did you expect to happen?  
- What feature did you look for?  
- Did Alpha Coach help?  
- Did anything feel slow?  
- What stopped you from completing your goal?  

---

## Watch every day

| Dashboard / signal | Where |
| --- | --- |
| Coach Insights | `/admin/coach-insights` |
| Registration funnel | Growth / auth analytics |
| Onboarding completion | Activation checklist / growth metrics |
| Broker connection success | Activation · Connected Accounts |
| First strategy activation | Activation · marketplace/subscribe |
| Coach usage | Coach Insights (messages, intents, WAU) |
| DAU / WAU | Product analytics / Coach Insights WAU |
| API errors | Sentry · host metrics |
| Sync failures | Connected Accounts · MetaAPI · logs |
| Support requests | support inbox / in-app support |

---

## Feature request discipline

1. Log requests in BETA_LOG (with frequency when known).  
2. Collect **2–4 weeks**.  
3. Rank by **frequency × impact × alignment with vision**.  
4. Only then schedule builds — prefer Coach Insights / activation bottlenecks over one-off asks.

---

## When Track B starts (evidence gates)

Open Strategy Builder Professional **only when**:

- Users consistently reach the Strategy area  
- Activation is healthy (broker + strategy/Coach milestones moving)  
- Coach Insights show strategy-related questions growing  
- Onboarding is no longer the main bottleneck  

Until then: Track B stays **spec-locked, build deferred** ([`tracks/B-strategy-builder/`](./tracks/B-strategy-builder/)).

---

## Closed beta success (suggested)

- ≥70% of cohort connect a broker within 7 days  
- ≥50% ask Alpha Coach ≥1 question  
- SEV1 = 0 in week 1 of invites  
- BETA_LOG filled daily; decisions cite evidence  

---

## Non-goals during beta

- Public launch  
- Strategy Builder implementation  
- New platforms / engines / audit frameworks  
- Shipping every requested feature immediately
