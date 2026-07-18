# Use Case Catalog

| ID | Use case | Persona | Policy class | MVP |
| --- | --- | --- | --- | --- |
| UC01 | Explain today’s P&L in plain language | P1–P3 | Informational | Yes |
| UC02 | Summarize this week’s performance | P1–P3 | Informational | Yes |
| UC03 | Explain my drawdown | P1–P2 | Informational | Yes |
| UC04 | Why was trade #N opened? | P2–P3 | Informational | Yes |
| UC05 | Why did trade #N close? | P2–P3 | Informational | Yes |
| UC06 | Which strategy contributed most? | P3 | Informational | Yes* |
| UC07 | Analyze exposure / open risk | P2–P3 | Advisory | Stretch |
| UC08 | Help connect a broker | P1 | Informational | FAQ |
| UC09 | Explain failed sync | P1–P3 | Informational | Pattern |
| UC10 | Compare two strategies | P3 | Informational | Post-MVP |
| UC11 | Suggest strategy parameter change | P3 | Advisory / Config | Post-MVP |
| UC12 | Pause / close / emergency stop | P2–P3 | Execution | **Never auto** |
| UC13 | Escalate to Executive | All | Escalation | Exists |
| UC14 | Marketplace bot performance for me | P5 | Informational | Post-MVP |

\*UC06 requires strategy attribution in grounding data; if missing, Coach must say so (no hallucination).
