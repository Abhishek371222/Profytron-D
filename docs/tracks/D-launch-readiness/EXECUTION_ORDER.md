# Track D — Execution Order (locked)

**Rule:** Continuous weekly work. Do **not** wait for Track B.  
**After D:** Controlled beta (20–50 users), then open Track B from Insights evidence.

## Priority order

| Priority | ID | Workstream | Why |
| ---: | --- | --- | --- |
| 🥇 1 | **D2** | Security & Secrets | Highest production risk if incomplete |
| 🥈 2 | **D1** | Production Infrastructure | Reliability, monitoring, restore |
| 🥉 3 | **D4** | Live MetaAPI Validation | Core trading path |
| 4 | **D3** | Payment Gateway Validation | Revenue path |
| 5 | **D5** | Production Email (+ OTP) | Auth & lifecycle |
| 6 | **D7** | Load & Resilience Testing | Confidence under traffic |
| 7 | **D8** | Runbooks & Operations | Detect / recover / support |
| 8 | **D6** | Closed Beta | 20–50 users after ops confidence |

## Phases

```text
D2 Security  →  D1 Infra  →  Live integrations (D4→D3→D5 + OAuth)
         →  D7 Load  →  D8 Ops  →  D6 Beta  →  Insights → open Track B
```

## “Yes” questions before broad launch

| Question | Primary workstream |
| --- | --- |
| Can we detect failures quickly? | D1, D8 |
| Can we recover from failures? | D1, D8 |
| Can we restore data? | D1 |
| Can we rotate secrets safely? | D2 |
| Can we onboard beta users? | D6, A |
| Can we support users during incidents? | D8 |

## After Track D

Controlled beta — **not** public launch. Use Coach Insights + activation analytics to decide when to implement Track B.
