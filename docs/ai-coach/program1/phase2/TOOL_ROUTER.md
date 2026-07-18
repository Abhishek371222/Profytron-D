# Tool Router — Phase 2

Minimum tool set per intent. **No recursive agent loops. No new API contracts.**

| Intent family | Tools |
| --- | --- |
| Down today / trades today / largest loss/gain | `analytics_trades`, `trading_history`, `trading_open` |
| Week / how performing | `analytics_portfolio`, `analytics_trades`, `analytics_strategy_comparison`, `trading_history` |
| Drawdown / risk | `analytics_risk`, `analytics_portfolio`, `coaching_report` |
| Best/worst strategy | `analytics_strategy_comparison`, `analytics_portfolio` |
| Trade why open/close/explain | `ai_explain_trade`, `trading_history`, `trading_open` |

Wired in web via existing clients: `analyticsApi`, `tradingApi`, `aiApi` (`run-mvp-explain.ts`).

Source: `apps/ai-coach/src/explainability/tool-router.ts`
