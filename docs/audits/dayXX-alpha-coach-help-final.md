# Day XX — Alpha Coach Empty States + Help Center Foundation

**Date:** 2026-08-03  
**Scope:** Alpha Coach UI empty/loading/error polish; Help Center + FAQ architecture  
**Verdict:** **PASS WITH OBSERVATIONS**

---

## Summary

Production-ready finish pass for Alpha Coach empty/error surfaces and Help Center foundation. Help uses a CMS/API-ready catalog (`help-catalog.ts`) with searchable categorized FAQs, deep links, analytics hooks, and FAQ JSON-LD. Coach empty states, history/search empties, live desk empties, and error banners use design tokens, primary/secondary CTAs, focus rings, and screen-reader roles.

No rewrite of core chat streaming logic; polish only where UX/a11y/token debt remained.

---

## Pages Audited

| Route / surface | Notes |
|---|---|
| `/alpha-coach` | Empty chat, bootstrap skeletons, error banner, executive wait |
| Coach chat panel / composer / message rows | Empty CTA set, loading dots, token colors |
| Chat history sidebar | Empty chats + search no-matches |
| Live trades rail | No broker / no positions / empty feed |
| `/help` | Full Help Center + FAQ UX |
| Help layout | SEO metadata + FAQ JsonLd from shared catalog |
| Shared FAQ SEO | `faq-items.ts` re-exports catalog |

---

## Empty States

| Surface | Headline / intent | Primary CTA | Secondary |
|---|---|---|---|
| Coach empty (no broker) | Start first coaching session | Connect broker | Coach help |
| Coach empty (with broker) | Where should we start? | Suggestions | Marketplace + help |
| Chat history empty | No chats yet | New chat | — |
| Chat history search | No matching chats | Clear search | — |
| Live desk no broker | No broker connected | Connect broker | — |
| Live desk no positions | No open positions | Open markets | — |
| Live desk empty feed | No recent signals | Contextual copy | — |
| Help FAQ no results | No matching FAQs | Clear filters / Contact support | Reset |

**Count audited/upgraded for this task:** 8 primary empty surfaces (+ shared DashboardEmptyState patterns already present elsewhere, not reworked).

---

## Help Structure

Scalable sections in `HELP_SECTIONS` (15 topics):

Getting Started · Account · Trading · Strategies · Marketplace · Billing · Risk · Brokers · Alpha Coach · Analytics · Security · API · Support · Status · Legal

Each section: id, title, description, expandable link set to in-app destinations (CMS-ready shape: pure data).

---

## FAQ Structure

- Model: `HelpFaqEntry` — id, category, tags, question, answer
- Search: client filter by category + query (question/answer/tags)
- Accordion + ARIA expanded / panel ids
- Deep links: `#faq-{id}` + open on hash
- Copy link control + toast-less clipboard UX
- Analytics: `help_search`, `help_faq_expand`, `help_faq_copy_link`
- SEO: `FAQ_ITEMS` for JsonLd; landing uses first 8 entries
- Markdown/rich-text ready as string answers (swap CMS later without component rewrite)

**FAQ entries:** 16 categorized entries

---

## Accessibility

- Focus-visible rings on coach CTAs, composer, feedback, history controls
- Error banner `role="alert"` + help/support links
- Empty `role="status"` regions
- Live regions on conversation log / typing row
- Reduced motion respected on Help accordion (framer `useReducedMotion`)
- FAQ accordion keyboard toggle patterns preserved
- Heading hierarchy on Help hero + sections

---

## Responsive Testing

Verified structurally (flex/wrap, safe-area composer, grid cols):

- Coach mobile: live rail drawer close + history sheet patterns retained
- Help: category chips wrap, search full width, section grid collapses
- Composer: safe-area bottom padding maintained

Manual device sweep at 320–1440 not re-run in CI this pass — layout uses existing responsive utilities; no overflow-prone fixed widths introduced.

---

## Performance Improvements

- No new heavy deps
- Static help catalog (tree-shakeable data module)
- Token cleanup only; no new chart/icon packs
- FAQ search is O(n) over ~16 items (negligible)

---

## Files Modified

- `apps/web/src/lib/help/help-catalog.ts` (foundation)
- `apps/web/src/lib/seo/faq-items.ts` (re-export)
- `apps/web/src/app/help/page.tsx`
- `apps/web/src/components/alpha-coach/CoachChatPanel.tsx`
- `apps/web/src/components/alpha-coach/ChatHistorySidebar.tsx`
- `apps/web/src/components/alpha-coach/LiveTradesRail.tsx`
- `apps/web/src/components/alpha-coach/CoachComposer.tsx`
- `apps/web/src/components/alpha-coach/CoachMessageRow.tsx`
- `apps/web/src/components/alpha-coach/ExecutiveWaitBar.tsx`
- `docs/audits/dayXX-alpha-coach-help-final.md` (this file)

---

## Remaining Risks / Observations

1. Coach **auto-creates** first conversation when list is empty — “no chats” empty is edge/search-dominant; bootstrap skeletons cover first paint.
2. Dedicated unit/a11y component tests for Help FAQ not added (web package has lint/build only; no test runner script).
3. Physical multi-viewport visual QA not automated this pass.
4. Hardcoded brand hex removed from Alpha Coach surface audited here; other product areas may still use legacy hex.

Non-blocking. Does not block production ship of this FE foundation.

---

## Production Readiness

**PASS WITH OBSERVATIONS**

Empty/error/help foundation is intentional and complete for the audited surfaces; deploy when lint/typecheck/build are green.
