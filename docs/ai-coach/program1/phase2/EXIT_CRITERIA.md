# Exit Criteria — Program 1 Phase 2 MVP

| # | Criterion | Status |
| ---: | --- | --- |
| 1 | Frozen MVP intents implemented | PASS — intent library + classifier |
| 2 | Existing APIs reused; no new backend contracts | PASS |
| 3 | Evidence-based responses (What/Why/Evidence/Meaning/Next) | PASS |
| 4 | Confidence + citations shown | PASS |
| 5 | Session context (selected trade / last intent) | PASS |
| 6 | Unsupported requests degrade gracefully | PASS — unknown → suggestions / legacy coach |
| 7 | No architecture / DB / API / trading-engine redesign | PASS |
| 8 | Automated explainability tests | PASS (run `mvp.test.ts`) |

## Success definition

Users can ask the frozen MVP questions and receive grounded, plain-language, transparent answers without autonomous trading actions.
