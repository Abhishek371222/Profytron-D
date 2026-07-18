# Empty State Guide — Phase 2

## Rule

Empty ≠ Error. Empty ≠ Filtered-out. Empty ≠ Offline.

## Required elements

1. Short title (“No broker accounts yet”)
2. One sentence of guidance
3. One primary CTA (connect, browse, create)
4. Optional secondary link (help / docs)

## Primitives

- `DashboardEmptyState` / dashboard empty CTAs — `apps/web/src/components/dashboard/DashboardPrimitives.tsx`
- Coach `EmptyState` — `CoachChatPanel.tsx`
- Marketplace filter empty — keep Reset filters when filters active; separate true-empty copy when catalog length is 0

## Checklist

- [ ] Load `isError` never renders empty-state copy
- [ ] Filter empty offers clear filters
- [ ] First-run empty offers next journey step
