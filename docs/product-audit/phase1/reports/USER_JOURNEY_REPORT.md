# User Journey Report

Evidence-only matrix from lab Playwright walks (2026-07-18T20:36:09.943Z).

**Base:** http://127.0.0.1:3000  
**JWT seeded:** yes  
**Probe depth:** screenshot + reachability smoke

## Summary

| Metric | Value |
| --- | --- |
| Journeys | 11 |
| Steps | 44 |
| Complete | 39 |
| Partial | 1 |
| Blocked | 3 |
| Missing | 1 |
| Skipped (policy) | 4 |

## Journey matrix

| Journey | Steps | Clicks | Wall ms | Console errs | Complete | Partial | Blocked | Missing |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| visitor | 4 | 4 | 30301 | 4 | 4 | 0 | 0 | 0 |
| auth | 7 | 6 | 34636 | 6 | 6 | 0 | 1 | 0 |
| onboarding | 4 | 4 | 27755 | 3 | 3 | 0 | 0 | 1 |
| broker | 3 | 2 | 7694 | 2 | 2 | 0 | 1 | 0 |
| dashboard | 3 | 3 | 10929 | 3 | 3 | 0 | 0 | 0 |
| strategies | 3 | 3 | 11065 | 3 | 3 | 0 | 0 | 0 |
| ai_coach | 3 | 2 | 7197 | 2 | 2 | 1 | 0 | 0 |
| billing | 6 | 5 | 19614 | 5 | 5 | 0 | 1 | 0 |
| settings | 7 | 7 | 25539 | 7 | 7 | 0 | 0 | 0 |
| marketplace | 2 | 2 | 7691 | 2 | 2 | 0 | 0 | 0 |
| error_recovery | 2 | 2 | 8497 | 3 | 2 | 0 | 0 | 0 |

## Step detail

| Journey | Step | Path | Status | ms | Errors | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| visitor | home | / | Complete | 8356 | 1 | journeys/visitor/home.png |
| visitor | pricing | /pricing | Complete | 7863 | 1 | journeys/visitor/pricing.png |
| visitor | about | /about | Complete | 8097 | 1 | journeys/visitor/about.png |
| visitor | help | /help | Complete | 5946 | 1 | journeys/visitor/help.png |
| auth | register | /register | Complete | 7363 | 1 | journeys/auth/register.png |
| auth | login | /login | Complete | 5761 | 1 | journeys/auth/login.png |
| auth | forgot | /forgot-password | Complete | 5969 | 1 | journeys/auth/forgot.png |
| auth | reset | /reset-password | Complete | 5954 | 1 | journeys/auth/reset.png |
| auth | verify | /verify-email | Complete | 5644 | 1 | journeys/auth/verify.png |
| auth | oauth_buttons | /login | Complete | 3919 | 1 | journeys/auth/oauth_buttons.png |
| auth | live_otp | /register | Blocked | 0 | 0 | — |
| onboarding | welcome | /onboarding | Missing | 11147 | 5 | — |
| onboarding | risk | /onboarding/risk | Complete | 3977 | 1 | journeys/onboarding/risk.png |
| onboarding | terms | /terms | Complete | 7016 | 1 | journeys/onboarding/terms.png |
| onboarding | risk_disclosure | /risk-disclosure | Complete | 5601 | 1 | journeys/onboarding/risk_disclosure.png |
| broker | accounts | /connected-accounts | Complete | 3690 | 1 | journeys/broker/accounts.png |
| broker | connect_cta | /connected-accounts | Complete | 3997 | 1 | journeys/broker/connect_cta.png |
| broker | live_metaapi | /connected-accounts | Blocked | 0 | 0 | — |
| dashboard | overview | /dashboard | Complete | 3523 | 1 | journeys/dashboard/overview.png |
| dashboard | analytics | /analytics | Complete | 3734 | 1 | journeys/dashboard/analytics.png |
| dashboard | markets | /markets | Complete | 3663 | 1 | journeys/dashboard/markets.png |
| strategies | browse | /strategies | Complete | 3707 | 1 | journeys/strategies/browse.png |
| strategies | builder | /strategies/builder | Complete | 3661 | 1 | journeys/strategies/builder.png |
| strategies | my_bots | /my-bots | Complete | 3686 | 1 | journeys/strategies/my_bots.png |
| ai_coach | open | /alpha-coach | Complete | 3554 | 1 | journeys/ai_coach/open.png |
| ai_coach | input | /alpha-coach | Complete | 3637 | 1 | journeys/ai_coach/input.png |
| ai_coach | live_stream | /alpha-coach | Partial | 0 | 0 | — |
| billing | pricing | /pricing | Complete | 5045 | 1 | journeys/billing/pricing.png |
| billing | billing | /billing | Complete | 3695 | 1 | journeys/billing/billing.png |
| billing | subscriptions | /subscriptions | Complete | 3583 | 1 | journeys/billing/subscriptions.png |
| billing | wallet | /wallet | Complete | 3594 | 1 | journeys/billing/wallet.png |
| billing | settings_billing | /settings/billing | Complete | 3680 | 1 | journeys/billing/settings_billing.png |
| billing | live_checkout | /billing | Blocked | 0 | 0 | — |
| settings | root | /settings | Complete | 3575 | 1 | journeys/settings/root.png |
| settings | profile | /settings/profile | Complete | 3731 | 1 | journeys/settings/profile.png |
| settings | security | /settings/security | Complete | 3555 | 1 | journeys/settings/security.png |
| settings | notifications | /settings/notifications | Complete | 3725 | 1 | journeys/settings/notifications.png |
| settings | trading | /settings/trading | Complete | 3581 | 1 | journeys/settings/trading.png |
| settings | api_keys | /settings/api-keys | Complete | 3746 | 1 | journeys/settings/api_keys.png |
| settings | support | /settings/support | Complete | 3602 | 1 | journeys/settings/support.png |
| marketplace | browse | /marketplace | Complete | 3826 | 1 | journeys/marketplace/browse.png |
| marketplace | success | /marketplace/success | Complete | 3859 | 1 | journeys/marketplace/success.png |
| error_recovery | not_found | /this-route-does-not-exist-product-audit | Complete | 4725 | 2 | journeys/error_recovery/not_found.png |
| error_recovery | authed_without_jwt | /dashboard | Complete | 3764 | 1 | journeys/error_recovery/authed_without_jwt.png |
