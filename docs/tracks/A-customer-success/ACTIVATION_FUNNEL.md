# Activation Funnel

```text
Signup → First login → Welcome / Risk profile → Connect broker
  → Verify sync → Explore dashboard → Ask Alpha Coach
  → Configure / subscribe strategy → Activate → First trade (paper or live)
  → Portfolio / Coach summary
```

## Milestone map (product)

| Step | Milestone | Activation event / signal | Primary href |
| --- | --- | --- | --- |
| 1 | Welcome | `FIRST_LOGIN` | `/dashboard` |
| 2 | Complete profile (Risk DNA) | `ONBOARDING_COMPLETED` | `/onboarding/risk` |
| 3 | Connect broker | `BROKER_CONNECTED` | `/connected-accounts` |
| 4 | Verify synchronization | Live account health / last sync UI | `/connected-accounts` |
| 5 | Explore dashboard | Session visit (analytics) | `/dashboard` |
| 6 | Ask Alpha Coach | `FIRST_COACH_INTERACTION` | `/alpha-coach` |
| 7 | Configure a strategy | Browse marketplace / my bots | `/marketplace` |
| 8 | Activate first strategy | `FIRST_MARKETPLACE_SUB` or bot deploy | `/marketplace` / `/strategies` |
| 9 | Review first portfolio summary | Coach briefing / analytics | `/alpha-coach` or `/analytics` |

## Drop-off measurement

For each step record: view → start → complete → abandon / retry.  
See [`METRICS.md`](./METRICS.md).
