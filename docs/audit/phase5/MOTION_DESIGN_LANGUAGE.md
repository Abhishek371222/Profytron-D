# Motion Design Language

| Interaction | Motion |
|-------------|--------|
| Hover | Subtle elevation + scale |
| Press | Compression (`scale ~0.97`) |
| Success | Highlight (color / ring) |
| Error | Color emphasis (shake only if quality Ultra/High) |
| Loading | Pulse / progress |
| Refresh | Number transition only |
| Navigation | Shared / view transition |
| Modal | Opacity + scale (or opacity-only on Minimal) |
| Toast | Slide + fade (opacity-only on Minimal) |

Quality levels degrade automatically — feature code does not branch.
