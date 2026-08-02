# Phase 9C — Billing Experience & Financial UX

**Status:** COMPLETE (local, uncommitted)  
**Date:** 2026-08-02

## Delivered

1. **Invoices** — deterministic numbers (`INV-YYYYMMDD-<paymentId>`), idempotent create, pdfkit PDF on demand, `GET /subscriptions/invoices/:id/download`, marketplace Payment+Invoice for fixed plans, invoice metadata (tax, gateway refs).
2. **Upgrade/downgrade** — cancel other ACTIVE platform subs on pay; carry remaining time; history preserved; upgrade agent event retained.
3. **Refunds** — `POST /admin/payments/:id/refund`; Razorpay `refund.created` + Stripe `charge.refunded` reconcile; wallet clawback only if prior DEPOSIT; user refund history; notifications/email.
4. **Billing Center** — unified `/billing` (plans + history + invoices + refunds + bots); `/settings/billing` redirects; aggregate `GET /subscriptions/billing-center`.
5. **Currency** — shared `formatMoney` / `formatInr` in `lib/currency.ts`; pricing re-exports; billing/marketplace pages updated.
6. **Payment results** — `/billing/result?status=success|failed|pending` with retry.
7. **A11y** — labels, reduced-motion, live regions, min 44px targets, invoice download labels.
8. **Performance** — one billing-center fetch (replaces 4 parallel subscription queries); bots still separate with staleTime.

## Verification

- `nest build` API — pass  
- `tsc --noEmit` web — pass  
- `jest src/modules/payments` — 29 passed, 5 skipped  

## Non-goals / limits

- No cash mid-cycle refund at upgrade (time carry-forward only).  
- No S3 storage of PDF (`pdfUrl` is download path).  
- Tax remains configurable rate on pretax line.  
- Full-app offline browser E2E not run in this pass.
