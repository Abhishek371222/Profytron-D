# Beta Log

**Purpose:** Daily historical record of closed beta — so product decisions stay tied to evidence, not memory.  
**Phase:** Closed beta (20–50 users) — **not** public GA.  
**Playbook:** [`CLOSED_BETA_PLAYBOOK.md`](./CLOSED_BETA_PLAYBOOK.md)

---

## How to fill (sources)

| Field | Where to look |
| --- | --- |
| Active / new users | Auth/analytics, admin growth metrics, host analytics |
| Coach Insights highlights | `/admin/coach-insights` · [`ai-coach/coach-insights/`](./ai-coach/coach-insights/) |
| Activation / funnel | Growth activation checklist metrics · Track A |
| Bugs / incidents | Sentry · support inbox · [`tracks/D-launch-readiness/runbooks/`](./tracks/D-launch-readiness/runbooks/) |
| Sync failures | Connected Accounts UI · API logs · MetaAPI status |
| Feature requests | Interviews using discovery questions in the playbook |
| Decisions / actions | What you chose **and why** (cite log rows later) |

**Rule:** Prefer discovery answers over “do you like it?” — see playbook.

---

## Daily entry template

Copy for each day:

```markdown
### YYYY-MM-DD

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | none / … |
| Coach Insights highlights | top intents, abandons, thumbs, unsupported |
| Feature requests | (frequency if known) |
| Decisions made | |
| Actions taken | |

```

---

## Log

### 2026-07-19

| Field | Notes |
| --- | --- |
| Active users | — (pre-invite / operator phase) |
| New users | — |
| Bugs found | — |
| Critical incidents (SEV1/SEV2) | none |
| Coach Insights highlights | Instrumentation ready; await cohort traffic |
| Feature requests | — |
| Decisions made | Closed beta launch docs locked; Track B remains evidence-gated |
| Actions taken | Created BETA_LOG + CLOSED_BETA_PLAYBOOK; operator Weeks 1–3 begin |

---

## Week 1 — Security + live UAT (blank rows)

Fill as you run secrets rotation and MetaAPI / Payments / Email UAT.

### W1-D1 (2026-07-19)

| Field | Notes |
| --- | --- |
| Active users | — (pre-invite) |
| New users | — |
| Bugs found | Earlier Render probe was wrong host; GCP API was live. Cloud Build `:latest` race fixed (SHA tags). Web typecheck failures fixed and deployed. |
| Critical incidents (SEV1/SEV2) | none (GCP API healthy) |
| Coach Insights highlights | N/A — pre-cohort |
| Feature requests | — |
| Decisions made | Canonical prod = GCP Cloud Run (`asia-south1`), not Render |
| Actions taken | Pushed + Cloud Build deploy; `/live` `/ready` `/health` 200; `/status` 200 on www + Cloud Run web |

### W1-D2 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W1-D3 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W1-D4 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W1-D5 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W1-D6 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W1-D7 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

---

## Week 2 — Load + stabilize (blank rows)

### W2-D1 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W2-D2 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W2-D3 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W2-D4 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W2-D5 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W2-D6 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W2-D7 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

---

## Week 3 — Invite 20–50 (blank rows)

### W3-D1 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W3-D2 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W3-D3 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W3-D4 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W3-D5 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W3-D6 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

### W3-D7 (YYYY-MM-DD)

| Field | Notes |
| --- | --- |
| Active users | |
| New users | |
| Bugs found | |
| Critical incidents (SEV1/SEV2) | |
| Coach Insights highlights | |
| Feature requests | |
| Decisions made | |
| Actions taken | |

---

<!-- After Week 3: copy the daily template above for Week 4+ observation days -->
