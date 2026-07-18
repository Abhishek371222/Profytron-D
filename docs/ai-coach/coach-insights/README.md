# Coach Insights (Product Team)

**Status:** Active — next investment after Coach capability track  
**Not:** Another intelligence program  
**Why:** Adoption, trust, and measurable outcomes beat more capabilities by intuition.

## Mission

Internal analytics layer that answers:

- What are the top user questions?
- Which intents are growing / unused?
- Which responses have low confidence?
- Which tools fail most often?
- Which evidence sources are missing?
- Where do users abandon or repeat unanswered questions?
- Does Coach usage correlate with retention? (phase 2 join)

## Continuous loop

```text
Instrument → Store → Aggregate → Insights UI → Prioritize build → Re-measure
```

## Success KPIs (product)

| Metric | Goal |
| --- | --- |
| Coach weekly active users | Increasing steadily |
| Suggested prompt CTR | High enough to prove discoverability |
| Follow-up question rate | Engagement / trust signal |
| Conversation completion rate | Users get answers vs abandon |
| Evidence-backed response rate | Near 100% for supported intents |
| Unsupported intent rate | Declining over time |
| Satisfaction (thumbs) | Positive trend |

## Delivery

1. Event taxonomy + client/server capture  
2. `CoachInsightEvent` persistence  
3. Admin Insights summary API + UI  
4. Later: retention join, cohort views  

**Next:** Feed roadmap decisions for Tracks A–D ([`../../V1_LAUNCH_CRITERIA.md`](../../V1_LAUNCH_CRITERIA.md)). Insights is the decision engine — not a reason to keep expanding Coach capabilities without evidence.
