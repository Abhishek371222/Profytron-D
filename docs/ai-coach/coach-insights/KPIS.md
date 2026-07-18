# Alpha Coach — Success Metrics (KPIs)

Product KPIs for Alpha Coach. Capability freezes are closed; these drive what to build next.

| Metric | Definition | Goal |
| --- | --- | --- |
| Coach WAU | Distinct users with ≥1 coach activity in last 7 days | Steadily increasing |
| Suggested prompt CTR | `suggestion_clicked` / `suggestion_impression` (or sessions with suggestions shown) | Discoverability signal |
| Follow-up rate | Messages after an assistant reply in same conversation within 30m | Engagement / trust |
| Completion rate | Turns that receive a response (grounded or stream) without abandon/error | High |
| Evidence-backed rate | Grounded responses with ≥1 citation / supported-intent responses | ~100% for supported intents |
| Unsupported intent rate | `intent = unknown` / all classified messages | Declining |
| Low-confidence rate | `confidence = Low` among grounded responses | Declining with data quality |
| Tool failure rate | Events with `tool_error` / grounded turns | Declining |
| Satisfaction | `feedback_up` / (`feedback_up` + `feedback_down`) | Positive trend |
| Return cadence | Users with activity on ≥2 distinct days in 7 / WAU | Weekly habit forming |

## Instrumentation questions (must be answerable)

1. Which suggested prompts are clicked most?  
2. Which explanations lead users to open a strategy or trade?  
3. How often do users ask follow-ups?  
4. Which capabilities (intents) are rarely used?  
5. Where do users abandon conversations?  
6. Do users return daily or weekly?  
7. Does Coach usage correlate with higher product retention? *(insights phase 2)*
