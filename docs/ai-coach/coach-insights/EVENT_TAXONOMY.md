# Coach Insights — Event Taxonomy

All events dual-write: PostHog (product analytics) + `POST /coach/insights/events` (first-party store).

Do **not** store secrets, tokens, or full account numbers. Question text is truncated (≤160 chars).

| Event | When | Key properties |
| --- | --- | --- |
| `coach_session_start` | Alpha Coach page mounted | `conversationId?` |
| `coach_suggestion_impression` | Suggestion chips rendered (once per session) | `labels` (joined) |
| `coach_suggestion_clicked` | User clicks a suggested prompt | `label`, `conversationId?` |
| `coach_message_sent` | User sends a message | `conversationId`, `source` (`typed`\|`suggestion`\|`retry`), `isFollowUp` |
| `coach_intent_classified` | After classify | `intent`, `supported` |
| `coach_response_received` | Grounded or stream reply done | `mode` (`grounded`\|`stream`\|`faq`), `intent?`, `confidence?`, `citationCount?`, `toolErrorCount?`, `toolsUsed?` |
| `coach_response_error` | Send/stream failed | `reason?` |
| `coach_evidence_expanded` | User opens evidence panel | `intent`, `confidence` |
| `coach_feedback` | Thumbs up/down | `value` (`up`\|`down`), `intent?`, `confidence?`, `mode?` |
| `coach_trade_selected` | Live rail trade selected for explain | `hasTradeId` |
| `coach_cta_open_strategy` | User follows “open strategy” style CTA *(when wired)* | `href?` |
| `coach_cta_open_trade` | User opens trade from coach context | `hasTradeId` |
| `coach_conversation_abandoned` | Page hide/unload after send without response | `conversationId?`, `waitMs?` |

## Aggregation rules (summary API)

- **Top questions:** group truncated `questionPreview` from `coach_message_sent`  
- **Intent growth:** count `coach_intent_classified` by intent over window  
- **Low confidence:** filter `coach_response_received` where `confidence=Low`  
- **Tool failures:** sum `toolErrorCount` / count grounded responses  
- **Unsupported:** `supported=false` / all classifications  
- **WAU:** distinct `userId` with any coach_* event in last 7d
