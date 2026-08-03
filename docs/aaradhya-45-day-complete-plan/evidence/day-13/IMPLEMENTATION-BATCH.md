# Implementation batch — Day 13 continuous + residual closeout

**Date:** 2026-08-02  
**Scope:** All code-closable Aaradhya Master Tracker residual work + public SEO/mobile/hardening.

## Apps/web changes (summary)

| Area | Files / notes |
|------|----------------|
| LCP (W01) | LandingPageClient idle heavy FX; SceneProvider idle start; RotatingWords static ≤767px; Lenis skip mobile |
| Cookie/L02 + M01 | CookieConsentBanner; PostHog only if consent granted |
| Safari A04 | Secure cookies on HTTPS in useAuthStore |
| Get Bots T07 | copy-trading polish, empty/error/paper deep links |
| Connected accounts | Empty bots, load error + retry |
| Billing P03 | Full plan features, empty plans, invoice CTA |
| Coach C03 | Bootstrap skeleton |
| Auth A09 | Verify-email copy |
| Risk W06 | Step complete microcopy |
| Analytics K03 | markActivationStart + time_to_first_broker seconds |
| SEO S03/S04/S11 | page-metadata, JsonLd, help FAQs, pricing FAQs, brokers intro + related, nav product group |
| Status | checking overall; honest incident copy; public contact support |
| Hardening | QueryClient networkMode online; web_vital → PostHog; apple icon path; docs/press meta |
| Community M08 | Discord/IG constants + events |

## Continue batch 2 (no-stop)

| Area | Changes |
|------|---------|
| M08 | Community Discord primary CTA (not Coming Soon) |
| Dashboard | History/journal/subscriptions/notifications empty CTAs |
| SEO | Guides/blog/careers/community related links |
| P09 | trial_started event; expanded UAT checklist |
| Bug | `bg-muted/505` → `bg-muted/50` |
| W01 | PublicPageLayout mobile ambient off + min-w-0 overflow |
| Docs | Days 16–28 checklist batch-2 footers |

## Blocked (not faked)

- Deploy + Lighthouse median  
- Safari/iOS device  
- ishit hero/long-form/custom OG art  
- Google Sheet live write  
- Manual Stripe trial UAT  

## Docs

- All `00-days/**/CHECKLIST.md` got code-closeout footer  
- `SHEET-SYNC.md` paste-ready  
- `REMAINING-EVERYTHING.md` honest residual list  
