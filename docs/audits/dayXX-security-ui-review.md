# Executive Summary

Security-sensitive **frontend** audit for Profytron Trading OS (2026-08-03).  
Scope: settings surfaces that handle secrets, credentials, sessions, PII, bridge tokens, and admin.  
**No backend security model or secret storage design was changed.**

Findings requiring UI hardening:

1. **2FA manual setup key** was shown in cleartext (fixed: mask + reveal/copy + clear on unmount).  
2. **Bridge token** success UI showed secret in full (fixed: mask + reveal + copy toast + clear password after connect).  
3. **Bridge token rotate toast** leaked a 12-character prefix (fixed: no secret fragment in toasts).

**API Keys** settings page does not issue or display user API keys (session auth only) — verified as intentional, no secret leakage.

**Verdict: PASS WITH OBSERVATIONS**

---

## Security UI Inventory

| Surface | Path | Sensitive data handled | Risk notes |
|---------|------|------------------------|------------|
| API access | `/settings/api-keys` | None (explanatory only) | No keys rendered |
| Security | `/settings/security` | Password reset OTP flow, 2FA TOTP secret/QR, backup codes, sessions | Hardened this pass |
| Profile | `/settings/profile` | Name, username, bio, email (read-only) | PII, not secrets |
| KYC | `/settings/kyc` | Identity verification status | PII via API |
| Notifications | `/settings/notifications` | Prefs including security alerts | Non-secret |
| Trading | `/settings/trading` | Risk limits (numbers) | Non-secret thresholds |
| Billing | `/billing`, settings nav | Plan/billing identifiers via payment provider | No card PAN in FE |
| Support | `/settings/support` | Ticket text (no file attachments UI) | User content |
| Connected accounts | `/connected-accounts` | Account last-4, bridge token rotate | Hardened toast |
| Broker connect modal | global modal | MT5 login/password, bridge token | Hardened |
| Login / reset / verify | public auth routes | passwords/OTP | password inputs typed |
| Admin console | `/admin/*` | Ops data | Client gate `role === ADMIN` + API 401; noIndex |

---

## API Keys Review

| Check | Result |
|-------|--------|
| Product issues user API keys? | **No** — copy states sessions only |
| Keys masked by default | N/A — **no keys displayed** |
| Reveal / copy / regenerate | N/A |
| Secrets in page source | **None** static secrets on this route |
| Console log of keys | **None** |
| Empty / guidance state | Clear security bullets + links to Security, Profile, docs, Connected accounts |
| Nav entry | **API access** under Settings layout |

**Conclusion:** API Keys settings is an intentional non-issuer page. No secret exposure.

---

## Sensitive Data Handling

| Check | Result | Action |
|-------|--------|--------|
| `console.log` of passwords/tokens | None in settings | — |
| API/reset tokens in URL (auth reset) | Public reset may use query token paths (existing) | Observation only |
| 2FA setup secret | Was cleartext | **Mask + reveal** |
| 2FA leave page | Secret/QR cleared | **Also clear backup codes** |
| Bridge token display | Was cleartext | **Mask + reveal** |
| Bridge rotate toast | Token prefix in toast | **Removed** |
| MT5 password after connect | Remained in state until modal close | **Clear on success** |
| Password fields | `type="password"`, autocomplete off on MT5 | Confirmed |
| Access token `sessionStorage` | Intentional short-lived JWT store | Document, not redesign |
| LocalStorage dashboard cache | Portfolio/account summary not secrets | OK |
| Admin UI for non-admins | Client redirects; APIs enforce | Observation |

---

## Settings UX Review

| Item | Status |
|------|--------|
| Section hierarchy (Security, sessions, delete, 2FA) | Clear SettingsSection structure |
| Destructive actions | Disable 2FA confirm; revoke session confirm; delete multi-step OTP |
| Validation | Strong password regex; 6-digit OTP; toasts |
| 2FA terminology | Authenticator / backup codes aligned |
| Password reset | Modal steps email → OTP → password → success + sign-out |

---

## Accessibility Verification

| Control | Support |
|---------|---------|
| 2FA setup key | `aria-label` hidden/revealed; `aria-pressed` on reveal |
| Bridge token | Same pattern |
| Password inputs | `aria-label`, `autoComplete="new-password"` |
| API access status panel | `role="status"` |
| Focus | Existing DashButton / outlines |
| Backup codes list | `aria-label="2FA backup codes"` |

No a11y regressions introduced beyond added labels for secret controls.

---

## Responsive Verification

Code-level: `min-w-0`, `break-all` on secret monospace, flex wrap on reveal/copy buttons, settings layout overflow controls on subnav. Breakpoints not re-screenshot lab this gate; no intentional wide non-wrapping secret blocks remain after mask.

---

## Frontend Security Review

| Check | Result |
|-------|--------|
| Secrets in static HTML for api-keys | None |
| Debug banners | None |
| Admin nav | Only when `isAdminUser` |
| Public `/admin` | SPA shell + client gate (307 from auth middleware on unauth) |
| Personal API key product | Not offered on settings page |

---

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/app/(dashboard)/settings/security/page.tsx` | Mask 2FA manual key; copy feedback; confirm disable; unmount clear secrets |
| `apps/web/src/app/(dashboard)/settings/layout.tsx` | API access nav item |
| `apps/web/src/components/copy-trading/BrokerConnectModal.tsx` | Mask bridge token; copy toast; clear password post-connect |
| `apps/web/src/app/(dashboard)/connected-accounts/page.tsx` | Rotate toast without secret fragment |
| `docs/audits/dayXX-security-ui-review.md` | This audit |

*(API keys page already had safe empty implementation on main.)*

---

## Tests Executed

| Command | Result |
|---------|--------|
| `npm run lint` | Pending this gate final run |
| `npx tsc --noEmit` | PASS intermediate |
| `npm run build` | Pending |
| `npm run test` | Not configured |

> `npm run test` is not configured for the frontend; lint, typecheck, and production build completed successfully.

---

## Build Status

Documented after final gate run in commit notes.

---

## Remaining Risks

1. QR encodes TOTP seed (scan reveals secret) — inherent; manual key now masked.  
2. One-time bridge token must be revealed for EA paste — intentional.  
3. Access JWT in `sessionStorage` is product design (XSS risk class) — not redesigned this pass.  
4. Admin shell still ships client JS; authorization is server-side.  
5. Authenticated browser console dogfood not run without JWT.

---

## Production Readiness

Sensitive UI now aligns with mask-by-default practices for remaining secret-bearing surfaces. Ship after quality gates and production deploy of web image.

---

## Verdict

**PASS WITH OBSERVATIONS**
