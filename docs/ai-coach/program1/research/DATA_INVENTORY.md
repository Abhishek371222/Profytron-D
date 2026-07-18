# Data Inventory

What the Coach can already access (or could access via existing APIs without new contracts).

## A. Already injected into Alpha Coach replies today

Source: `apps/api/src/modules/coach/coach.service.ts` → `buildAccountSnapshot`

| Data | Detail |
| --- | --- |
| Active broker account | Default connected account |
| Open trades | Up to ~20 |
| Closed trades (window) | ~80 / 30d for WR, P&L, approx drawdown |
| Closed sample lines | ~12 lines in prompt |
| Conversation history | Last ~8 messages |
| FAQ snippets | Top ranked FAQ (Jaccard / keywords) |

**Not** in coach prompt today: strategy names, `AITradeExplanation`, analytics Sharpe/expectancy, full snapshot performance JSON, journal insights, notifications, billing.

## B. Exists in platform — available for MVP grounding (read-only)

| Domain | Models / APIs | Use for |
| --- | --- | --- |
| Trades | `Trade`, `GET /trading/trades/open|history` | Why closed; lists |
| Trade AI notes | `AITradeExplanation`, `POST /ai/explain-trade/:id` | Why opened (when computed) |
| Snapshots | `AccountSnapshot*`, broker snapshot routes | Equity, risk, positions |
| Analytics | `GET /analytics/portfolio`, risk, trades, strategy-comparison | Week/month summaries |
| Strategies | `Strategy`, `StrategyPerformance`, subscriptions | Attribution |
| Risk | `GET /risk/*` | Risk language |
| Journal | `/journal`, insights | Optional stretch |
| Notifications | `Notification*` | Ops explanations later |
| Billing | subscriptions / wallet APIs | Product help later |
| FAQ DB | `CoachFaqAnswer` / `CoachFaqQuestion` | Product Q&A |

## C. Gaps (missing or weak for ambition)

| Gap | Impact | MVP handling |
| --- | --- | --- |
| No `entryReason` on `Trade` | Can’t invent why opened | Use explain API or say unknown |
| Coach ignores `/ai/explain-trade` | Duplicate stacks | MVP should consume existing store/API |
| Coach ignores analytics controllers | Shallow summaries | Ground from existing GETs in service layer (no contract change) |
| Client context not sent | UI/server split | Server remains SoT for MVP |
| Dual `/coach` vs `/ai/chat` prompts | Inconsistent safety tone | Document; unify in implementation phase |
| Multi-account | Snapshot = one active | Disclose scope in answers |

## D. Must never fabricate

P&L numbers, trade reasons, strategy rankings, sync health, or billing status **not present** in grounding payload.
