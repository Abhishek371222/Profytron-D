# Conversation Patterns (Design Only)

Reusable flows. **No implementation in Phase 1.**

Each pattern should produce an answer conforming to [EXPLAINABILITY_FRAMEWORK.md](./EXPLAINABILITY_FRAMEWORK.md).

---

## CP01 — Explain today’s performance

**Trigger examples:** “Why is my account down today?” “How did I do today?”  
**Grounding:** Closed/open trades since local day start or UTC day; equity delta if available.  
**Structure:** What happened → Why (trades/strategies) → Meaning → Next step.  
**If no trades:** Say so; offer week summary.

## CP02 — Summarize period performance

**Triggers:** “Summarize this week.” “Monthly performance?”  
**Grounding:** Analytics portfolio range or closed trades in window.  
**Include:** Net P&L, WR, approx DD, top/bottom strategy if known.  
**Uncertainty:** If multi-account, state active account only.

## CP03 — Analyze recent trades

**Triggers:** “Review my last trades.”  
**Grounding:** Recent closed + open list.  
**Output:** Short table-like bullets (symbol, side, P&L, time) + 1–2 insights.

## CP04 — Why this trade opened / closed

**Triggers:** “Why was this trade opened?” + ticket/symbol.  
**Grounding:** Trade row + `AITradeExplanation` if present + strategy name.  
**If no rationale:** Explicit “No stored entry reason; here’s what we know (symbol, time, strategy).” Never invent signal logic.

## CP05 — Explain drawdown

**Triggers:** “Explain my drawdown.”  
**Grounding:** Approx DD from coach stats / snapshot risk.  
**Meaning:** Peak-to-trough language for beginners.  
**Next:** Link to risk settings / pause — Advisory only.

## CP06 — Strategy contribution

**Triggers:** “Which strategy contributed most?”  
**Grounding:** Group closed P&L by `strategyId` or analytics comparison.  
**If unlinked trades:** Disclose “Some trades have no strategy tag.”

## CP07 — Help connect broker

**Triggers:** “How do I connect a broker?”  
**Grounding:** FAQ + deep link `/connected-accounts`.  
**No:** Collect passwords in chat.

## CP08 — Failed synchronization

**Triggers:** “Why is sync offline?”  
**Grounding:** Sync/MT5 status surfaces if readable; else FAQ + escalate.  
**Next:** Connected accounts / support.

## CP09 — Compare two strategies

**Post-MVP:** Needs richer strategy performance blocks.

## CP10 — Escalate

**Triggers:** “Talk to a human” / low confidence.  
**Action:** Existing escalate flow + SLA messaging.
