# Program 2 — Portfolio Intelligence (Research)

**Status:** Complete  
**Build order:** After Explainability MVP  
**Pattern:** Same grounded pipeline — Intent → Tools → Evidence → Template

## Job to be done

Give the trader a **30-second portfolio briefing**: money made/lost, health, what changed, what needs attention — grounded in account data.

## Locked intents (build)

| Intent | Example |
|--------|---------|
| `portfolio_briefing` | How is my portfolio today? |
| `portfolio_changed_since_yesterday` | What changed since yesterday? |
| `portfolio_needs_attention` | What needs attention? |
| `portfolio_where_making_money` | Where am I making money? |
| `portfolio_where_losing` | Where am I losing money? |
| (existing) `portfolio_how_performing` / trades today / largest gain-loss / risk |

## Tools (existing only)

- `analytics_portfolio`, `analytics_risk`, `analytics_strategy_comparison`, `analytics_trades`
- `trading_history`, `trading_open`
- Optional: live balance/equity fields already on portfolio payload

## Non-goals

- Multi-agent orchestration
- Auto rebalancing / execution
- Invented market commentary
- Cross-account portfolio until product scope expands (scope note remains active-account)

## Exit criteria

- [x] Research locked
- [x] Grounded responses for locked intents
- [x] Confidence + citations
- [x] Tests green
