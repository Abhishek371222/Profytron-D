# Motion Lifecycle

```mermaid
stateDiagram-v2
  [*] --> Created
  Created --> Queued
  Created --> Running
  Created --> Disposed
  Queued --> Running
  Queued --> Interrupted
  Queued --> Disposed
  Running --> Interrupted
  Running --> Completed
  Running --> Disposed
  Interrupted --> Running
  Interrupted --> Completed
  Interrupted --> Disposed
  Completed --> Disposed
  Disposed --> [*]
```

Recovery on interrupt / tab-hidden / dispose:

- Critical / Interaction / Feedback → **Finish** (snap to final)
- Decorative / Idle → **Cancel** (settle current or drop)
- Explicit resume when tab visible again
