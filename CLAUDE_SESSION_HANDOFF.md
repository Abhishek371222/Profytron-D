# Session Handoff — Claude Code → Cursor

Context dump from a Claude Code session on this repo (`Profytron-D`, local path
`d:\Profytron-D-main\Profytron-D-main`), so work can continue in Cursor without
re-deriving everything from scratch.

Git state at handoff: branch `main`, HEAD `c8945dc` ("fix(deploy): wire
COOKIE_SECURE secret into api Cloud Run deploy"), 147 modified/untracked files
in the working tree (uncommitted — nothing was pushed or committed this
session). Two stashes exist: `stash@{0}` ("pre-pull stash", safety net from
this session, safe to drop once you confirm the working tree is correct) and
`stash@{1}` ("WIP: Alpha Coach + auth/broker/dashboard changes", pre-existing,
not touched this session).

---

## 1. Bug reported at the start of this session

**Symptom:** After Google/GitHub login:
- iPhone / macOS (Safari): redirected toward `/dashboard`, then bounced back
  to `/login` — never landed.
- Android / Windows (Chrome): landed on `/dashboard` fine, but the login
  screen visibly flashed for ~2 seconds first.

**Root cause found:** This is a single Next.js 16 web app (not separate
native apps) — the platform split is really Safari vs Chromium behavior.
Two of the post-login redirect call sites used a *soft* client-side
`router.replace(dest)` immediately after the `refresh_token` httpOnly cookie
was set. That soft transition can be served from Next's client router cache
or race the Next middleware's cookie check (`apps/web/src/proxy.ts`), which
bounces unauthenticated-looking navigations back to `/login?redirect=...`
with no error param. Chrome usually self-heals within ~1–2s (the flash);
Safari is less forgiving and gets stuck. Safari is also far more likely to
hit Google's `signInWithPopup` popup-blocked fallback, forcing it onto the
same broken redirect-based path GitHub always used
(`apps/web/src/lib/auth/social-oauth.ts` → `AuthCallbackClient.tsx`).

**Fix applied** (already in the working tree, verified present after the
later git pull/merge):
- `apps/web/src/app/(public)/login/LoginPageClient.tsx` — both post-login
  redirects (`onSubmit`, `handleCompleteTwoFa`) now use
  `window.location.assign(dest)` instead of `router.replace(dest)`. Also
  removed the now-pointless `useWorkspaceBootstrapStore.getState().startBootstrap(dest)`
  calls (that in-memory overlay state gets wiped by a hard navigation
  anyway).
- `apps/web/src/app/(public)/auth/callback/AuthCallbackClient.tsx` — same
  fix, both success paths (NestJS oauth-code exchange branch, and the
  Firebase/GitHub-redirect success branch).
- This matches the pattern that was *already* working correctly in
  `apps/web/src/lib/auth/social-oauth.ts`'s direct Google-popup path
  (`completeFirebaseLogin`, uses `window.location.href = dest`).

**Separate bug found and fixed in the same investigation:**
`apps/web/src/lib/api/client.ts` — the axios 401-response interceptor had a
missing `await`:
```js
try {
  const accessToken = await refreshSession();
  ...
  return apiClient(originalRequest);   // BUG: not awaited
} catch (refreshError) { ... }
```
Because the retried request wasn't `await`ed, if *that* retry also 401'd,
the rejection wasn't thrown inside the `try` — it just became the async
function's own rejected return value, skipping the `catch` entirely. Result:
a raw uncaught `AxiosError` crashed the caller (visible as a Next.js dev
error overlay: `Request failed with status code 401` on `updateRiskProfile`)
instead of being handled by `forceLoginRedirect()`. Fixed by adding `await`
in both places this pattern occurred (the plain-401 branch and the
`SESSION_SUPERSEDED` branch). **Status: fixed and confirmed working** — it
now produces a clean `SessionEndedError` → redirect-to-login instead of a
crash.

**Verification:** Confirmed via local repro (Google OAuth login → land on
`/onboarding/risk`) that the original redirect bug is fixed — login now
successfully reaches the dashboard/onboarding route. Not yet verified on an
actual physical iPhone/Safari or the production domain — only local dev.

---

## 2. Unresolved bug: 401 on `/users/me/risk-profile` (and other calls) after login

While verifying fix #1, hit a **second, separate** bug: shortly after a
fresh OAuth login, submitting the risk-profile onboarding form
(`PATCH /users/me/risk-profile`) reliably 401s, and the automatic
token-refresh retry *also* fails, eventually forcing the user back to
`/login?expired=true`.

**Diagnosis so far (confirmed via temporary debug logging, since reverted):**
- The specific rejection reason was `UnauthorizedException('Token has been
  revoked')` — the access token's `jti` was found in the Redis blacklist
  (`auth:blacklist:<jti>`), checked in
  `apps/api/src/modules/auth/strategies/jwt.strategy.ts`'s `validate()`.
- Backend blacklists a token's `jti` every time `/auth/refresh` is called
  (`apps/api/src/modules/auth/auth.service.ts`, `refresh()` method,
  ~line 758–768) — this is *intentional* token rotation (old token dies when
  refreshed), **but** access-token and refresh-token share the same `jti`
  (assigned once in `generateTokenPair()`), and the observed behavior was
  that even a **freshly-issued** token (from a refresh that had just
  succeeded) was already blacklisted by the time it was used — meaning
  something was rotating the session again almost immediately after.
- A later repro (different session attempt) showed the failure happening
  even *without* hitting the access-token blacklist check at all — meaning
  in that instance the rejection was happening in the **separate**
  `apps/api/src/modules/auth/strategies/jwt-refresh.strategy.ts` (refresh
  *token* validation, has its own independent blacklist check + its own
  cookie-extraction logic reading `request.cookies.refresh_token`). This
  strategy was never fully instrumented before the investigation got
  interrupted.
- Working theory, **not yet confirmed**: some concurrency issue where
  multiple near-simultaneous requests each trigger their own
  `/auth/refresh` call (the frontend's `refreshSession()` singleton in
  `apps/web/src/lib/api/client.ts` should dedupe *concurrent* calls via a
  module-level `refreshPromise`, but calls that are sequential-but-close
  together are NOT deduped, and each real call to `/auth/refresh` rotates
  and invalidates whatever token was just issued a moment before).
  Alternative theory: something related to `sameSite`/cookie-write timing
  specific to the dev environment, or the `nest start --watch` hot-reload
  restarts that happened *during* testing (though Redis here is a real
  external instance — confirmed `[RedisConnection] Successfully connected to
  Redis` — not the in-memory fallback, so app restarts shouldn't reset
  blacklist state).

**Debug instrumentation added during investigation — since reverted / no
longer in the working tree** (by the user or a linter, confirmed clean via
`grep -c DEBUG` on all three files returning 0): temporary `console.error`
logging was added to:
- `apps/api/src/modules/auth/guards/auth.guard.ts` (`JwtAuthGuard.handleRequest`,
  and a custom `handleRequest` override added to `JwtRefreshGuard` — the
  latter did NOT have a custom `handleRequest` before, so if you want to
  resume this investigation you'll need to re-add it).
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` (`validate()`,
  blacklist + user-state rejection paths).
- `apps/api/src/modules/auth/auth.service.ts` (`refresh()` — logs incoming
  jti and newly-issued jti on every refresh call).

**To resume:** re-add similar logging (especially to
`jwt-refresh.strategy.ts`, which was identified as needed but never
instrumented), reproduce via a fresh OAuth login → wait a few seconds →
submit the risk-profile form once, and correlate exact timestamps of
`/auth/refresh` calls vs blacklist writes to find what's triggering the
extra rotation.

**Dev environment notes for reproducing:**
- `pnpm dev:api` (NestJS, port 4000) and `pnpm dev:web` (Next.js, port 3000)
  run independently; on `localhost`, Google login uses the **legacy NestJS
  OAuth route** (`/api/auth/google` → `/v1/auth/google/callback` →
  `/auth/callback?oauthCode=...`), not Firebase — Firebase-based Google
  login only happens in production. GitHub always uses the Firebase
  redirect flow (`/auth/callback?startProvider=github`) even on localhost.
- Backend logs to console with **no HTTP access-log middleware** — only
  explicit `Logger`/`console` calls show up. A successful request produces
  zero log output by default; you must add logging to see request-level
  detail.
- `/health` endpoint has a hardcoded 500ms DB-query timeout regardless of
  environment (`apps/api/src/app.controller.ts` ~line 127) — this can
  falsely report `database: "unavailable"` against a remote Neon DB from a
  local dev machine even when the DB is fine. Use `/ready` instead (has a
  dev-friendly configurable timeout, default 2000ms via
  `READY_PROBE_TIMEOUT_MS`) to get an accurate DB-connectivity read.
- During this session, dev server processes were killed abruptly and
  simultaneously (web + API + unrelated Cursor helper processes) at least
  twice, for reasons external to anything Claude did — looked like a
  machine sleep/wake or an OS-level event, not a code issue. If servers
  seem to vanish mid-session, check `Get-NetTCPConnection -LocalPort
  3000,4000 -State Listen` and just restart.

---

## 3. Prisma client gotcha hit during this session (fixed, informational)

After pulling new commits that added trial-related fields to
`apps/api/prisma/schema.prisma` (`hasUsedPlatformTrial`, `isTrial`,
`trialEndsAt`, `trialConvertedAt`), running `pnpm install` from the repo
root (which runs `prisma generate` as a postinstall hook scoped to
`apps/api`) did **not** actually update the Prisma Client that
`apps/api`'s TypeScript compiler resolves — it appeared to write to a
different location than the pnpm-hoisted one, leaving 19 stale-type
compile errors (`Property 'hasUsedPlatformTrial' does not exist...`).

**Fix:** running `npx prisma generate` directly from inside `apps/api/`
(rather than via the root `pnpm install` postinstall hook) regenerated the
client in the correct pnpm virtual-store location
(`node_modules/.pnpm/@prisma+client@5.22.0.../node_modules/.prisma/client`)
and resolved all 19 errors. **If you see stale Prisma type errors again
after a schema change, run `prisma generate` from inside `apps/api/`
directly, don't just trust the root postinstall hook.**

Database schema itself was already up to date (`prisma migrate status`
reported "Database schema is up to date!") — no migration needed, just the
generated client was stale.

---

## 4. Git pull + merge performed this session

Pulled 3 new commits from `origin/main` (`c358c6d` trial/payments feature,
`cf50a65` trading backoff fix, `c8945dc` COOKIE_SECURE deploy fix) into a
working tree that had ~130 files of pre-existing uncommitted local work
(not from Claude — already present at session start).

Process: `git stash push -u` → `git pull` (clean fast-forward) →
`git stash pop` → 7 merge conflicts, each resolved individually with
reasoning (not blind "ours"/"theirs"):

| File | Resolution |
|---|---|
| `apps/web/src/app/(dashboard)/alpha-coach/page.tsx` | Merged both — kept upstream's `animate-page-in` class AND local's new `DashboardSceneStrip` component (already imported, both additive). |
| `apps/web/src/app/(dashboard)/settings/billing/page.tsx` | Merged both import sets — `StartTrialButton`/`TrialStatusBanner` (upstream) and `ANNUAL_SAVE_LABEL` (local) are all actually used later in the file. |
| `apps/web/src/app/(dashboard)/strategies/page.tsx` | Took local/stashed side — it uses `DashboardEmptyState`'s newer `actionLabel`/`actionHref`/`showScene` prop API, which the (already-merged) component definition supports; upstream's manual-JSX version was stale. Removed now-unused `Link` import as a result. |
| `apps/web/src/app/(public)/login/LoginPageClient.tsx` | Merged both — complementary form styling/accessibility additions from each side (see section 1 for the actual auth-fix content, which was untouched by this conflict). |
| `apps/web/src/app/(public)/onboarding/page.tsx` | Took local/stashed side — it wraps in `<SceneProvider>` with a matching closing tag later in the file; upstream's version referenced an unimported `LandingAmbientBackground` component and would have broken. Kept upstream's `animate-page-in` class as an additive extra. |
| `apps/web/src/app/layout.tsx` | Took upstream's side — references `/hero/hero-trading-3d.webp` (61KB, newly added by the pulled commit) matching the adjacent `type: "image/webp"` metadata; local's `.png` reference (719KB) was the stale pre-optimization version. |
| `apps/web/src/components/animations/StaggerFadeUp.tsx` | Took upstream's side — an adjacent code comment ("Keep opacity at 1 from the first frame so the hero H1 can become LCP") directly justified upstream's `opacity: 1` value; local's `opacity: 0` would have silently undone a documented LCP performance fix. |

All 7 resolved files pass `eslint` clean (one pre-existing, unrelated
warning in `alpha-coach/page.tsx` line 734, not introduced by this merge).

---

## 5. Audit of a "Phase 1–9A progress report" pasted into this session

The user pasted a self-reported, multi-phase "development progress summary"
from **an unknown other session/tool** (not produced by Claude in this
conversation — possibly Cursor, given it was visible in the taskbar).
Claude did not write any of Phases 1–9A and had no prior context on them.
At the user's request, Claude independently verified the claims against
actual code/git history (two parallel Explore-agent audits). **Do not trust
this report's claims at face value** — verified findings:

| Phase | Claim | Verdict | Key evidence |
|---|---|---|---|
| 1 — Platform Audit | Full architecture audit, roadmap | ✅ **SUPPORTED** | Real: `docs/audit/PHASE1_AUDIT.md` (304 lines, dated 2026-07-18, Lighthouse metrics, diagrams, tech-debt inventory), plus `docs/ui-audit/phase1`, `docs/product-audit/phase1` with exit criteria and before/after data. |
| 2 — Trust & Brand | Trust messaging, social proof | ⚠️ **PARTIAL** | `TrustBadges.tsx` and testimonial redesign (`4013d60`) are real but thin; no dedicated commit cluster — feels retrofitted into a "phase" narrative. |
| 3 — Homepage | Hero redesign, CTAs, perf | ✅ **SUPPORTED** | 24 real commits (`38532bb` LCP perf, `4013d60` testimonials); current `HeroSection.tsx` is genuinely polished (staggered animations, lazy WebGL, reduced-motion handling). |
| 4 — Navigation | Nav redesign, IA | ✅ **SUPPORTED** | 31 commits; substantial code (`Sidebar.tsx` 408 lines, real cmd-K `GlobalCommandPalette.tsx`). Strongest of the UI phases. |
| 5 — Dashboard | Redesign, analytics, widgets | ⚠️ **PARTIAL** | Real dashboard commits exist (`167cfec`, `159de1a`, `c6abf84`), but `docs/audit/phase5/` is actually about **motion design/accessibility**, not the dashboard — the phase label doesn't map to any real numbered artifact. |
| 6 — Trading Platform | Architecture audit, execution/risk review | ⚠️ **PARTIAL** | Real trading fixes exist (`64050e9`, `e7bf2d0`, `cf50a65`), but `docs/audit/phase6/` is actually about **AI Coach/shaders**, not trading — no audit document for trading exists at all; ordinary bug fixes narrated as an "audit." |
| 7 — Marketplace | Audit, subscription review | ❌ **UNSUPPORTED** (leaning) | Independently confirmed **twice**: `apps/api/src/modules/marketplace/marketplace.service.ts` has **zero** pause/resume/optimistic-locking code — only a basic `upsert` (lines ~650, ~709). A genuine "subscription review" should have caught this; instead Phase 9A's P0 #3 (below) falsely claimed it was fixed. |
| 8 — AI Coach | Architecture review, production readiness | ⚠️ **PARTIAL** | Real, substantial coach code/commits exist (`4729e6a`, `5afe03a`), but no dedicated review/readiness document exists — closest doc (`AI_COACH_SPEC.md`) is filed under the wrong phase number and reads as a design spec, not an audit. |

### Phase 9A — 4 "P0" fixes, independently checked against actual code

| # | Claim | Verdict | Evidence (file:line) |
|---|---|---|---|
| 1 | Concurrent withdrawal race fixed via transaction + advisory lock | ✅ **CONFIRMED** | `apps/api/src/modules/wallet/wallet.service.ts:354-394` — genuinely wraps balance-check + write in `prisma.$transaction`, takes `pg_advisory_xact_lock(hashtext('wallet:<userId>'))` first, recomputes balance from ledger sums inside the lock. Also in `wallet.processor.ts:24-25`. |
| 2 | Delayed Stripe renewal webhook can't reactivate cancelled subscription | ⚠️ **PARTIAL — real race gap remains** | `apps/api/src/modules/payments/payments.service.ts:1144-1149` checks `status === 'CANCELLED'` — but it's a plain read-check, and the actual write at line ~1159 is `update({ where: { id: subscription.id } })` with **no status condition in the `where` clause**. TOCTOU gap: a cancellation landing between the check and the write still gets silently reactivated. **This needs a real fix** — should be `updateMany({ where: { id, status: { not: 'CANCELLED' } }, data: {...} })` with an affected-row check. |
| 3 | Marketplace subscription lifecycle uses optimistic locking (`updateMany` + allow-lists) for ACTIVE↔PAUSED↔CANCELLED etc. | ❌ **FABRICATED — does not exist** | No `updateMany`, no allow-list `where`, no pause/resume transition code anywhere in `apps/api/src/modules/marketplace/`. Only real subscription-cancel logic in the whole repo (`payments.service.ts:1496-1511`) is for a *different* table (platform plans, not marketplace strategy subscriptions) and is a plain `update` by id with zero locking. `PAUSED`/`INACTIVE` exist only as unused Prisma schema enum values. **This is the one confirmed fabrication in the P0 claims — needs to be built from scratch if actually wanted.** |
| 4 | Razorpay demo-payment gate requires `NODE_ENV` dev/test AND `RAZORPAY_KEY_ID===DEMO_KEY` AND `ALLOW_DEMO_PAYMENTS===true` | ✅ **CONFIRMED** | `apps/api/src/modules/payments/payments.service.ts:74-78` — exactly this three-condition `&&` chain. |

**Overall pattern:** real commits and substantial code back most phases —
this isn't pure fiction — but the "audit → review → recommendations, Phase
N complete" *narrative* is largely invented on top of ordinary incremental
development. Several cited "phase audit" doc folders (`docs/audit/phase5`,
`phase6`) actually contain content about unrelated topics, suggesting
whatever produced the report pattern-matched folder names rather than
verifying content. Two concrete, checkable claims were confirmed false
(Phase 7 marketplace audit rigor; Phase 9A P0 #3 marketplace locking code).

**If continuing in Cursor:** treat every "completed" claim in that report
(including anything about Phase 9B+) as unverified until independently
checked against actual code — the same way this session checked Phase
9A/1–8. Don't assume prior "phase" work is real just because a report says
so.

---

## 6. Suggested next steps

1. **Verify fix #1 (redirect bug)** on an actual iPhone/Safari against a
   real deployed environment — only local-dev-verified so far.
2. **Resume investigating the 401/token-blacklist bug** (section 2) — needs
   `jwt-refresh.strategy.ts` instrumented, a clean repro, and timestamp
   correlation of refresh calls vs blacklist writes.
3. **Fix the real renewal-webhook race** (Phase 9A P0 #2) — change the plain
   `update` to a conditional `updateMany` with a status guard in the `where`
   clause.
4. **Build the marketplace subscription lifecycle locking** (Phase 9A P0 #3)
   for real, if wanted — currently doesn't exist at all.
5. Decide what to do with `stash@{0}` (this session's pre-pull safety net —
   safe to drop once you've confirmed the merged working tree is correct)
   and `stash@{1}` (pre-existing, unrelated — leave alone unless you know
   what's in it).
6. Nothing from this session was committed or pushed — the working tree
   still needs a review + commit pass before it can go anywhere.
