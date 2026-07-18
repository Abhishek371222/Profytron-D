# Credential inventory (names only)

**Never store secret values in this file.**  
Production values live in Secret Manager / host env. Local dumps are gitignored.

| Secret / config name | Used for | Typical store | Rotate with |
| --- | --- | --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Postgres | Neon + Secret Manager | Neon password reset |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Auth tokens | Secret Manager | Dual-secret window then cutover |
| `AES_MASTER_KEY` | Field encryption | Secret Manager | Re-encrypt migration plan |
| `METAAPI_TOKEN` | Broker/trading API | Secret Manager | MetaAPI dashboard |
| `STRIPE_SECRET_KEY` / webhook secret | Payments | Secret Manager | Stripe dashboard |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments | Secret Manager | Razorpay dashboard |
| `GOOGLE_CLIENT_SECRET` / `GITHUB_CLIENT_SECRET` | OAuth | Secret Manager | Provider consoles |
| `FIREBASE_*` + private key | Push / admin | Secret Manager | Firebase console |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged Supabase | Secret Manager | Supabase |
| `UPSTASH_REDIS_REST_TOKEN` | Redis | Secret Manager | Upstash |
| `SENTRY_DSN` | Errors | Env (low sensitivity) | Sentry |
| Email provider API key | Transactional mail | Secret Manager | Provider |
| `ADMIN_MT5_*` | Ops MT5 | Secret Manager | Broker + MetaAPI |

Public (expected client-side): `NEXT_PUBLIC_*`, Firebase web `apiKey` (still restrict by domain/App Check).

Template for empty local setup: `apps/api/.env.example`, `apps/web/.env.example`.
