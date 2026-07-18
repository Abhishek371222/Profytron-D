# Capability Map

Legend: ✅ available for MVP grounding · ⚠ partial · ❌ not today · Backend = new contract / architecture (out of Phase 1; avoid for MVP)

| Capability | Available today | Coach chat uses it? | MVP path | Requires new API contract? |
| --- | :---: | :---: | --- | :---: |
| Explain account metrics (WR, P&L, DD approx) | ✅ Snapshot in `CoachService.buildAccountSnapshot` | ✅ Coarse | Strengthen + structure | ❌ |
| Explain trade history sample | ✅ Closed trades in snapshot | ✅ Sample lines | Deeper grounding | ❌ |
| Summarize performance | ⚠ Coach stats + `/analytics/*` unused | ⚠ | Wire analytics **read** into coach grounding (same user JWT) | ❌ if reuse existing GETs |
| Explain why trade opened | ⚠ `/ai/explain-trade/:id` + `AITradeExplanation`; Trade has no entry-reason field | ❌ Not in chat | Call existing explain or state “no rationale stored” | ❌ |
| Strategy attribution | ⚠ `Trade.strategyId`, `StrategyPerformance`, analytics comparison | ❌ | Include strategy names in grounding | ❌ |
| Configure strategy | ⚠ Strategies APIs exist | ❌ | **Post-MVP** Advisory/Config | Maybe UX only |
| Execute trading action | ✅ Trading APIs (close, modify, emergency-stop) | ❌ | **Never auto** — Action Policy | N/A |
| FAQ / product help | ✅ FAQ seed + match | ✅ | Keep | ❌ |
| Human escalation | ✅ Escalation + admin | ✅ | Keep | ❌ |
| Streaming replies | ✅ SSE `/messages/stream` | ✅ | Keep | ❌ |
| Client live book context | ✅ `useCoachContext` UI | ❌ Not sent to API | Optional later; server remains source of truth | ❌ |
| Cross-account portfolio intelligence | ⚠ Multi broker accounts | ❌ Single active account in snapshot | Roadmap | Maybe |
| Proactive alerts | ⚠ Notifications exist | ❌ | Roadmap | Maybe |
| Tool-calling agent loop | ❌ | ❌ | Not required for MVP | Would be new pattern — defer |

## MVP rule

Only capabilities supported by the **frozen platform** (existing data + existing read APIs) enter MVP. No new models. No architecture redesign.
