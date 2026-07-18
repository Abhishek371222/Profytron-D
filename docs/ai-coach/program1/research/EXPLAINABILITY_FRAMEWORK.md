# Explainability Framework

Every Coach explanation (MVP+) should answer four questions, in order:

## 1. What happened?

Factual, time-bounded statement grounded in data.

> “Over the last 7 days on your active account, closed P&L is −$420 across 18 trades.”

## 2. Why did it happen?

Causal factors **present in data** (strategy tags, symbols, win rate, open exposure). If unknown, say unknown.

> “Most of the loss came from Strategy Alpha on XAUUSD (3 losers). I don’t have a stored entry reason for ticket 18422.”

## 3. What does it mean?

Plain language for the persona (especially beginners). Avoid dumping raw Sharpe without translation.

> “A short losing streak isn’t necessarily a broken bot — but your drawdown is higher than your recent average, so risk is elevated.”

## 4. What can the user do next?

One primary next step + optional secondary. Respect Action Policy (no silent execution).

> “Review Strategy Alpha in My Bots, or ask me to summarize open exposure. I can escalate to an Executive if you want a human.”

---

## Anti-patterns

| Avoid | Prefer |
| --- | --- |
| Generic LLM pep talk | Grounded numbers |
| Disclaimer walls as the whole answer | Brief boundary + substance |
| Invented market narrative | Platform facts |
| “You should buy/sell now” | Advisory or link to UI |

## Grounding requirement

If the grounding block does not contain the fact, the answer must not assert it.
