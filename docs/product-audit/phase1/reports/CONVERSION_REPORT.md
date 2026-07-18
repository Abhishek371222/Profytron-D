# Conversion Report (Lab)

**Not production analytics.** Rates derived from journey step statuses in this lab run.

**Overall lab success rate:** 0.889

| Journey | Success rate | Skip rate | Avg step ms | Total wall ms |
| --- | --- | --- | --- | --- |
| visitor | 1 | 0 | 7566 | 30301 |
| auth | 0.857 | 0.143 | 4944 | 34636 |
| onboarding | 0.75 | 0 | 6935 | 27755 |
| broker | 0.667 | 0.333 | 2562 | 7694 |
| dashboard | 1 | 0 | 3640 | 10929 |
| strategies | 1 | 0 | 3685 | 11065 |
| ai_coach | 0.667 | 0.333 | 2397 | 7197 |
| billing | 0.833 | 0.167 | 3266 | 19614 |
| settings | 1 | 0 | 3645 | 25539 |
| marketplace | 1 | 0 | 3843 | 7691 |
| error_recovery | 1 | 0 | 4245 | 8497 |

## Step funnel detail

### Visitor marketing (`visitor`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| home | / | Complete | 1 | no | 8356 |
| pricing | /pricing | Complete | 1 | no | 7863 |
| about | /about | Complete | 1 | no | 8097 |
| help | /help | Complete | 1 | no | 5946 |

### Authentication surfaces (`auth`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| register | /register | Complete | 1 | no | 7363 |
| login | /login | Complete | 1 | no | 5761 |
| forgot | /forgot-password | Complete | 1 | no | 5969 |
| reset | /reset-password | Complete | 1 | no | 5954 |
| verify | /verify-email | Complete | 1 | no | 5644 |
| oauth_buttons | /login | Complete | 1 | no | 3919 |
| live_otp | /register | Blocked | 0 | no | 0 |

### Onboarding (`onboarding`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| welcome | /onboarding | Missing | 0 | yes | 11147 |
| risk | /onboarding/risk | Complete | 1 | no | 3977 |
| terms | /terms | Complete | 1 | no | 7016 |
| risk_disclosure | /risk-disclosure | Complete | 1 | no | 5601 |

### Broker connection (`broker`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| accounts | /connected-accounts | Complete | 1 | no | 3690 |
| connect_cta | /connected-accounts | Complete | 1 | no | 3997 |
| live_metaapi | /connected-accounts | Blocked | 0 | no | 0 |

### Dashboard (`dashboard`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| overview | /dashboard | Complete | 1 | no | 3523 |
| analytics | /analytics | Complete | 1 | no | 3734 |
| markets | /markets | Complete | 1 | no | 3663 |

### Strategies (`strategies`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| browse | /strategies | Complete | 1 | no | 3707 |
| builder | /strategies/builder | Complete | 1 | no | 3661 |
| my_bots | /my-bots | Complete | 1 | no | 3686 |

### AI Coach (`ai_coach`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| open | /alpha-coach | Complete | 1 | no | 3554 |
| input | /alpha-coach | Complete | 1 | no | 3637 |
| live_stream | /alpha-coach | Partial | 0.5 | no | 0 |

### Billing & subscriptions (`billing`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| pricing | /pricing | Complete | 1 | no | 5045 |
| billing | /billing | Complete | 1 | no | 3695 |
| subscriptions | /subscriptions | Complete | 1 | no | 3583 |
| wallet | /wallet | Complete | 1 | no | 3594 |
| settings_billing | /settings/billing | Complete | 1 | no | 3680 |
| live_checkout | /billing | Blocked | 0 | no | 0 |

### Settings (`settings`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| root | /settings | Complete | 1 | no | 3575 |
| profile | /settings/profile | Complete | 1 | no | 3731 |
| security | /settings/security | Complete | 1 | no | 3555 |
| notifications | /settings/notifications | Complete | 1 | no | 3725 |
| trading | /settings/trading | Complete | 1 | no | 3581 |
| api_keys | /settings/api-keys | Complete | 1 | no | 3746 |
| support | /settings/support | Complete | 1 | no | 3602 |

### Marketplace (`marketplace`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| browse | /marketplace | Complete | 1 | no | 3826 |
| success | /marketplace/success | Complete | 1 | no | 3859 |

### Error recovery probes (`error_recovery`)

| Step | Path | Status | Lab rate | Drop-off | ms |
| --- | --- | --- | --- | --- | --- |
| not_found | /this-route-does-not-exist-product-audit | Complete | 1 | no | 4725 |
| authed_without_jwt | /dashboard | Complete | 1 | no | 3764 |
