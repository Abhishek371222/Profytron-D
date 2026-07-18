# Program 2 — Portfolio Intelligence

**Status:** Shipped (grounded pipeline)  
**Parent track:** [`../CAPABILITY_ROADMAP.md`](../CAPABILITY_ROADMAP.md)  
**Architecture:** Extends [`../program1/phase2/ARCHITECTURE.md`](../program1/phase2/ARCHITECTURE.md)

## Mission

Fastest way to understand an account — 30-second briefings, day deltas, attention flags, make/lose attribution.

## Shipped intents

| Intent | Example |
|--------|---------|
| `portfolio_briefing` | How is my portfolio today? / 30-second summary |
| `portfolio_changed_since_yesterday` | What changed since yesterday? |
| `portfolio_needs_attention` | What needs attention? |
| `portfolio_where_making_money` | Where am I making money? |
| `portfolio_where_losing` | Where am I losing money? |
| Existing portfolio_* / performance_* | How am I doing, trades today, largest gain/loss |

## Evidence fields added

Health label, margin health, sync error, live balance/equity, attention flags, equity day delta, strategy attribution.

## Freeze note

Active-account scope only. Multi-account “best accounts” deferred until product exposes multi-account coach scope.
