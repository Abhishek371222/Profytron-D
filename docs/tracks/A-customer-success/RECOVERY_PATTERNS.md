# Recovery Patterns (A3)

Users should not hit dead ends.

| Failure | Pattern |
| --- | --- |
| Broker connection fails | Show reason · Retry CTA · Link Connected Accounts / troubleshooting tips |
| Sync delayed | Show status + last successful sync · Reconnect |
| Strategy validation fails | Name the setting that failed · Fix CTA |
| AI / Coach request fails | Preserve draft · Retry · Keep conversation context |
| Load errors (lists) | `DashErrorState` with Retry — never “empty” copy for failures |

## Implementation notes

- Broker modal: error stays on form with retry submit + recovery tip strip.  
- Coach: existing `lastFailedText` + Retry banner.  
- Lists: distinguish error vs empty (Product Excellence Phase 2 pattern).
