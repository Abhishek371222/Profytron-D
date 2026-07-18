# AI Coach Visual Spec

## Emotions (hard limit)

| State | Meaning |
|-------|---------|
| Idle | Ready |
| Thinking | Processing |
| Tool | Tool execution |
| Streaming | Token stream |
| Speaking | Voice visualization (visual only) |
| Success | Completed |
| Error | Failed |

No playful/expressive emotions beyond this set.

## Implementation
- [`CoachOrb`](apps/web/src/components/experience/CoachOrb.tsx) — CSS orb
- [`coach-visual.ts`](apps/web/src/platform/experience/coach-visual.ts) — state API
- Wired into ChatbotWidget + CoachBrandMark when `NEXT_PUBLIC_EXPERIENCE_ENGINE !== '0'`
