# SECURITY_REPORT — Phase 1

## Row-level security

| Finding | Evidence |
|---------|----------|
| RLS flags scanned via `pg_class.relrowsecurity` | `live-audit.json → rls` |
| Expected posture | **App-layer authZ** (JWT + Nest guards), not Postgres RLS |

Tables with RLS enabled: **0** / 80

## Database roles (login-capable sample)

| Role | Super | Create role | Create DB | Login |
|------|:-----:|:-----------:|:---------:|:-----:|
| cloud_admin | true | true | true | true |
| neon_service | false | true | true | true |
| neondb_owner | false | true | true | true |

## Secrets

| Item | Posture |
|------|---------|
| `DATABASE_URL` / `DIRECT_URL` | Env-only; not committed (audit harness reads local `.env`) |
| Redis / Upstash tokens | Env / Render secrets |
| 2FA backup codes | Stored hashed/array on user record — treat as sensitive |

## Least privilege

- Neon typically uses a single application role via connection string.
- No evidence of per-tenant DB users.
- Phase 2: confirm Neon role is non-superuser for app runtime.

## Sensitive data storage

- PII: User email/name/KYC fields in `User` and related tables
- Broker credentials / tokens: broker connection fields (encrypt-at-rest depends on Neon volume encryption + app encryption helpers)
- Payment identifiers: Payment/Invoice tables

**Do not** log raw `live-audit.json` publicly — may include query text snippets.
