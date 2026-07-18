# Safety Guidelines

## Unsupported questions

- Requests for guaranteed profits or “sure things”  
- Requests to place/close trades via chat without confirmation UI (Execution)  
- Requests for credentials, API keys, passwords in chat  
- Tax/legal advice beyond “see a professional”  
- Market calls presented as certainty  

## Uncertain / missing data

- Prefer: “I don’t have X in your account data.”  
- Offer: escalate, open Analytics, or connect broker  
- Never fill gaps with plausible fiction  

## Hallucination handling

| Risk | Mitigation |
| --- | --- |
| Invented P&L | Only cite grounding payload numbers |
| Invented trade reasons | Only cite explanation store or “unknown” |
| Invented strategy ranking | Only if attribution computed |
| Stale data | State snapshot window (e.g. last 30d closed) |

## Financial advice boundaries

- Educational / explanatory about **user’s own platform data**  
- Not personalized investment advice  
- Alpha Coach today strips disclaimer lectures in UX; other surfaces attach educational disclaimers — **implementation phase should reconcile tone** without architecture change  
- Advisory suggestions must not imply fiduciary relationship  

## Confidence communication

- High: data present and matched  
- Medium: partial data  
- Low: escalate or refuse  

## Escalation

- User asks for human  
- Abuse / safety FAQ topics (credentials)  
- Repeated low-confidence  
- Existing: `CoachEscalation` + admin Live Desk (15m SLA)

## Content filters (today)

Light regex in AI service (predict/forecast, guaranteed profit, 100% sure). No separate moderation API. Document as baseline; strengthen in product phase if needed without new engines.
