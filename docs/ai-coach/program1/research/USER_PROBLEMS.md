# User Problems (Problem Catalog)

Problems the AI Coach *could* solve. MVP addresses a subset — see [MVP_SCOPE.md](./MVP_SCOPE.md).

## Learning

| ID | Problem | MVP? |
| --- | --- | --- |
| L1 | Explain metrics (WR, P&L, expectancy) | Yes |
| L2 | Explain drawdown | Yes |
| L3 | Explain margin / leverage (product FAQ + risk context) | Partial (FAQ today) |
| L4 | Explain platform concepts (bots, copy, paper) | FAQ today |

## Trading

| ID | Problem | MVP? |
| --- | --- | --- |
| T1 | Why was this trade opened? | Yes (grounded; use explain API / metadata when available) |
| T2 | Why did it close? | Yes |
| T3 | Why is profit falling? | Yes (plain-language performance) |
| T4 | Why is risk increasing? | Partial (DD + open risk from snapshot; deep risk API later) |
| T5 | Which strategy contributed most? | Yes if strategy linkage available in data |

## Product navigation

| ID | Problem | MVP? |
| --- | --- | --- |
| P1 | Connect broker help | FAQ / patterns (post-MVP polish) |
| P2 | Configure strategy help | Roadmap (safe-config) |
| P3 | Marketplace help | FAQ / later |
| P4 | Billing help | FAQ today |

## Operations

| ID | Problem | MVP? |
| --- | --- | --- |
| O1 | Error interpretation | Partial FAQ |
| O2 | Sync status explanation | Pattern design; data from MT5/sync surfaces |
| O3 | Notification explanation | Later |

## Trust & psychology

| ID | Problem | MVP? |
| --- | --- | --- |
| X1 | Fear after drawdown — need calm grounded summary | Yes |
| X2 | “Is the system broken or is this normal variance?” | Yes (explain + next step) |
