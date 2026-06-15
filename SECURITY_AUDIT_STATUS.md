# Profytron Security Audit — Detailed Status Report

## Executive Summary

- **Total Issues Found:** 32 (4 CRITICAL, 6 HIGH, 10 MEDIUM, 6 LOW, 6 INFORMATIONAL)
- **Issues Fixed in Round 3:** 14 (1 CRITICAL, 3 HIGH, 8 MEDIUM, 2 LOW)
- **Issues Still Pending:** 18 (3 CRITICAL, 3 HIGH, 2 MEDIUM, 4 LOW, 6 INFORMATIONAL)
- **Completion:** 44% (14/32 fixed)

---

## CRITICAL — 3 Remaining (BLOCKS PRODUCTION)

### ⚠️ C-2: Refresh token stored as plaintext in Redis
**File:** `auth.service.ts` lines 77–93, 447–490  
**Severity:** CRITICAL

**Problem:** Raw JWT refresh token written to Redis at `auth:refresh:{userId}:default` and compared byte-for-byte on every refresh call.

**Attack:** If Redis is compromised (leaked Upstash ACL token, SSRF within VPC, misconfigured endpoint), attacker extracts the raw refresh token and impersonates any user indefinitely without further interaction.

**Fix:**
- Hash the token before storing: `SHA256(refreshToken)` → stored in Redis
- Compare hashed values on validation, never store raw token
- Adds one hash operation (negligible overhead)

---

### ⚠️ H-1: Role read from JWT, never re-checked against DB
**File:** `strategies/jwt.strategy.ts` lines 32–38  
**Severity:** HIGH

**Problem:** `validate()` returns `{ role: payload.role }` from the JWT payload itself. Role guards check this in-memory value, never touching the database.

**Attack:** Admin stripped of role in the database. Attacker's existing access token (valid for 1–24 hours depending on `JWT_ACCESS_EXPIRES`) still passes all `@Roles('ADMIN')` checks for the full token TTL.

**Fix:**
- After blacklist check, fetch the user from DB (or Redis cache, 30–60s TTL)
- Return live role from database, not from JWT payload
- Alternatively, reduce JWT TTL to ≤15 minutes so role changes propagate faster

---

### ⚠️ H-2: Single-slot refresh token (attacker can evict victim)
**File:** `auth.service.ts` lines 77–93, 447–490  
**Severity:** HIGH

**Problem:** Every login/OAuth/magic-link writes to the same key `auth:refresh:{userId}:default`. When a second device logs in, the first device's refresh token is silently invalidated. There is no multi-session / multi-device model.

**Attack:** Attacker steals a refresh token (XSS, network interception in dev). They call `/refresh` first, which overwrites the Redis key with a new token. The legitimate user's next `/refresh` fails. Attacker now has a fresh session while user is logged out with no clear explanation.

**Fix:**
- Implement per-session model: `auth:refresh:{userId}:{sessionId}` where sessionId is a UUID
- Include `sid` claim in the refresh JWT
- Allow multiple concurrent refresh tokens per user
- Implement refresh token reuse detection: if two refresh calls happen with the same JTI simultaneously, invalidate the entire session family (all sessions for that user)

---

## HIGH — 3 Remaining (LIKELY EXPLOITABLE)

### ⚠️ H-3: Supabase endpoint merges identities without binding guard
**File:** `auth.service.ts` lines 632–699 (`supabaseLogin`)  
**Severity:** HIGH

**Problem:** The `provider` field from the DTO is logged but never validated or stored. The `upsert` will merge a Supabase identity into an existing local account without checking if that account already has a different provider binding.

**Attack:** Attacker creates a Supabase account with the victim's email (e.g., via Google OAuth if they have the victim's Google account). They then call `POST /auth/supabase` with a valid Supabase token. The server verifies the token and email match, then `upsert`s the local user with `emailVerified: true` and issues full JWTs — effectively hijacking the victim's local account without ever knowing the local password.

**Fix:**
- Add `supabaseId` column to the User model (unique per provider)
- Check: if `existingUser.passwordHash` exists (local account) AND `!existingUser.supabaseId`, refuse the merge
- Require the user to explicitly link identities via an authenticated endpoint
- Store both the external provider ID and the provider name as a binding

---

### ⚠️ H-6: Google strategy state CSRF parameter not explicitly configured
**File:** `strategies/google.strategy.ts` lines 34–38  
**Severity:** HIGH

**Problem:** `passport-google-oauth20` may handle state internally by default, but the config does not explicitly set `state: true`. OAuth CSRF protection depends on the state parameter being generated, sent in the auth request, and verified against the callback.

**Fix:**
```typescript
super({
  clientID: ...,
  clientSecret: ...,
  callbackURL: ...,
  state: true,  // ← explicit
});
```

---

### ⚠️ H-8: Magic link token in GET query string (appears in logs and history)
**File:** `auth.controller.ts` lines 272–291 (`verifyMagicLink`)  
**Severity:** HIGH

**Problem:** `GET /auth/magic-link/verify?token=<uuid>` puts the authentication token in the URL query string. This causes it to appear in:
1. Browser history (user can see it)
2. Server access logs (ops/security team can see it)
3. Referer headers sent to third-party analytics/CDN
4. Load-balancer logs
5. Proxies and firewalls

**Attack:** Anyone with access to logs or someone who watches the victim's Referer header can extract the magic link token.

**Fix:**
- Change to POST endpoint that accepts token in request body
- Frontend can accept the token in the URL fragment (`#token=...`), then immediately POST it to `/auth/magic-link/verify` with Content-Type: application/json
- This keeps the token off logs and out of Referer headers

---

## MEDIUM — 2 Remaining

### ⚠️ M-1: Backup codes stored plaintext in database (not hashed)
**File:** `twofa.service.ts` lines 78–85, 108–115  
**Severity:** MEDIUM

**Current State:** Fixed code consumption (single-use) but still stored as plaintext strings in the DB.

**Problem:** If the database is compromised, attacker gets all valid backup codes for all users and can immediately disable 2FA on any account.

**Fix:**
```typescript
// When storing backup codes:
const hashedCodes = codes.map(code => bcrypt.hashSync(code, 10));
await prisma.user.update({ data: { twoFactorBackupCodes: hashedCodes } });

// When verifying:
const match = await bcrypt.compare(incomingCode, hashedCode);
```

---

### ⚠️ M-3: TOTP secret stored plaintext in database (no encryption at rest)
**File:** `twofa.service.ts` line 48  
**Severity:** MEDIUM

**Problem:** `twoFactorSecret` (a Base32 TOTP seed) is stored as a plain string in the `user` table. Database compromise gives attackers the TOTP seed for every enrolled user, allowing them to generate valid TOTP codes indefinitely.

**Fix:**
```typescript
// When storing:
const encrypted = this.cryptoService.encrypt(secret);
await prisma.user.update({ data: { twoFactorSecret: encrypted } });

// When reading:
const encrypted = user.twoFactorSecret;
const secret = this.cryptoService.decrypt(encrypted);
```

---

### ⚠️ M-6: user_role and onboarding_completed cookies are JS-readable
**File:** `auth.controller.ts` lines 72–90  
**Severity:** MEDIUM

**Current State:** `sameSite: strict` was added, but `httpOnly: false` remains.

**Problem:** Frontend JavaScript can read these cookies. If role-based UI decisions are made based on the cookie value (not the JWT), XSS can forge a role. Even if the backend validates, the cookie is still unnecessarily exposed.

**Fix:**
- Set `httpOnly: true` on both cookies
- Serve these values via a `GET /auth/me` endpoint that requires JWT authentication
- Frontend reads from JWT (which is already validated) or fetches from `/auth/me`

---

### ⚠️ M-10: changePassword doesn't blacklist the current access token
**File:** `users.service.ts` lines 159–187  
**Severity:** MEDIUM

**Current State:** `changePassword` deletes the refresh token and invalidates sessions, but does not blacklist the current access token JTI.

**Problem:** If a user changes their password because they suspect compromise, the attacker's access token remains valid for up to 24 hours (if `JWT_ACCESS_EXPIRES=24h`). The attacker can continue making requests while the user thinks they've secured their account.

**Fix:**
```typescript
// Accept the current JTI from the request context
const jti = req.user.jti;
if (jti) {
  const accessExpiry = this.parseExpirySeconds(process.env.JWT_ACCESS_EXPIRES, 3600);
  await this.redisService.set(`auth:blacklist:${jti}`, 'true', accessExpiry);
}
```

---

## LOW — 4 Remaining

| ID | File | Issue | Fix |
|----|------|-------|-----|
| **L-1** | `auth.service.ts:179–182` | `devOtp` exposed in response when `NODE_ENV !== 'production'` | Gate on explicit `EXPOSE_DEV_OTP=true` env var, not on NODE_ENV |
| **L-3** | `strategies/google.strategy.ts:59–65` | Google OAuth `accessToken` unnecessarily included in user object (can leak to logs) | Remove from returned object: `delete profile.accessToken` |
| **L-4** | `users.service.ts:138–157` | `revokeSession` and `revokeAllOtherSessions` don't delete Redis refresh tokens | Map `sessionId → jti` and invalidate the JTI when session is revoked |
| **L-5** | `dto/auth.dto.ts` | No `@MaxLength` on password fields; `bcrypt` silently truncates at 72 bytes | Add `@MaxLength(128)` to `LoginDto.password` and `RegisterDto.password` |

---

## INFORMATIONAL — 2 Items

| Item | Issue | Action |
|------|-------|--------|
| **L-2** | `LEGACY_JWT_SECRET` in `.env.example` but never used in code | Remove from `.env.example` or implement actual migration path if this was intentional |
| **L-6** | `JwtAuthGuard` not registered as global `APP_GUARD`; new routes default to unauthenticated | Register globally in `app.module.ts` with `@Public()` decorator for opt-out; clearer security posture |

---

## Work Breakdown by Priority

### Priority 1: BLOCKS PRODUCTION (3 issues, ~2–3 hours)
1. C-2: Refresh token hashing
2. H-1: Role re-validation from DB
3. H-2: Per-session refresh token model with reuse detection

### Priority 2: HIGH RISK (3 issues, ~1–2 hours)
1. H-3: Supabase identity binding guard
2. H-6: Google state parameter
3. H-8: Magic link POST conversion

### Priority 3: MEDIUM RISK (6 issues, ~1–1.5 hours)
1. M-1: Backup code bcrypt hashing
2. M-3: TOTP secret encryption
3. M-6: Cookies to httpOnly (with `/auth/me` endpoint)
4. M-10: changePassword JTI blacklist
5. L-1: devOtp gating
6. L-3, L-4, L-5: Minor fixes

### Priority 4: HOUSEKEEPING (2 items, ~15–20 minutes)
1. L-2: Remove unused `LEGACY_JWT_SECRET`
2. L-6: Global guard + `@Public()` decorator

---

## Deployment Recommendation

**DO NOT DEPLOY to production until Priority 1 is complete.** The three remaining critical/high issues (C-2, H-1, H-2) directly enable account takeover with minimal attacker resources.

Recommend:
1. Fix Priority 1 (P1) → test with security team
2. Fix Priority 2 (P2) → security review
3. Deploy with P1 + P2 fixes
4. Schedule P3 + P4 for next sprint (less urgent, but still important)

---

## Summary

✅ **Session 3 Delivered:** 14 fixes (JWT algorithm pinning, 2FA enforcement, OTP brute force, OAuth CSRF, magic link DTO, cookie security, WebSocket blacklist checks, search PII removal)

⏳ **Still Required:** 18 fixes to achieve 100% security hardening and production readiness

**Estimated Total Time to 100%:** 4–7 hours from start of Priority 1
