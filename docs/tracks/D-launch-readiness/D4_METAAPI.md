# D4 — Live MetaAPI UAT

## Goal

Prove a real MT5 account can connect, sync, and show health — not just UI reachability.

## Prerequisites

- `METAAPI_TOKEN` in API secrets  
- Real MT5 login / password / server  
- Staging or prod-like API + web  

## Opt-in product-audit probe

```bash
ALLOW_LIVE_METAAPI=1 pnpm product-audit:journeys
```

(Without the flag, `live_metaapi` remains Blocked by design.)

## Manual UAT script

| # | Step | Pass criteria | Evidence |
| ---: | --- | --- | --- |
| 1 | Open `/connected-accounts` | Page loads | screenshot |
| 2 | Connect paper account | Account appears | account id |
| 3 | Connect live MT5 via modal | Success panel; no hard error | screenshot + account id |
| 4 | Wait for sync | Balance/equity or “pending deploy” explained | notes |
| 5 | Refresh health | Last sync / status visible | screenshot |
| 6 | `/health` | `metaApi: configured`, status ok/degraded | curl output |
| 7 | Disconnect/reconnect (optional) | Recovery path works | notes |

## Evidence template

Copy to `evidence/D4_METAAPI_<YYYYMMDD>.md`:

```text
Date:
Operator:
Environment:
Account ids:
Curl /health:
Pass/Fail:
Blockers:
```

## Exit

⬜ Signed evidence file attached · V1 gate 5 MetaAPI line flip
