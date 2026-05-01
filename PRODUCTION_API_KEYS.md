# Profytron Production API Keys Guide

This document outlines all third-party API keys and credentials needed to run Profytron in production. Update these in your `.env` file before deploying.

## Database & Infrastructure

### PostgreSQL (Neon)
- **Env vars:** `DATABASE_URL`, `DIRECT_URL`
- **Provider:** Neon PostgreSQL
- **Setup:** Already configured, ensure you have a dedicated production database
- **Current:** Demo database from Neon

### Redis (Upstash)
- **Env vars:** `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Provider:** Upstash (Serverless Redis)
- **Setup:** Create account at upstash.com, create Redis database
- **Current:** Demo Upstash instance

## Authentication & Security

### JWT Secrets
- **Env vars:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- **Provider:** Generated locally
- **Setup:** Generate strong random 32+ character strings:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Current:** Demo values
- **⚠️ CRITICAL:** These must be kept secure and never committed to version control

### Supabase Auth
- **Env vars:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWKS_URL`, `SUPABASE_JWT_KID`, `SUPABASE_JWT_JWK`
- **Provider:** Supabase
- **Setup:** Create project at supabase.com, copy credentials from project settings
- **Current:** Demo Supabase project

### Google OAuth
- **Env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **Provider:** Google Cloud Console
- **Setup:**
  1. Create OAuth 2.0 credential in Google Cloud Console
  2. Set redirect URI to `https://yourdomain.com/v1/auth/google/callback`
- **Current:** Demo credentials
- **Note:** Update callback URL to production domain

### GitHub OAuth
- **Env vars:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
- **Provider:** GitHub Developer Settings
- **Setup:**
  1. Create OAuth app at github.com/settings/developers
  2. Set redirect URI to `https://yourdomain.com/v1/auth/github/callback`
- **Current:** DEMO_* placeholder values

### Firebase
- **Env vars:** `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- **Provider:** Firebase Console
- **Setup:** Create Firebase project, download credentials JSON
- **Current:** Demo project credentials
- **Note:** FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL are for service account

## Payments

### Stripe
- **Env vars:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Provider:** Stripe
- **Setup:**
  1. Create Stripe account
  2. Get keys from Dashboard > API Keys
  3. Webhook secret from Dashboard > Webhooks (endpoint: `/v1/webhooks/stripe`)
- **Current:** Test mode keys (`sk_test_*`, `pk_test_*`)
- **Note:** Switch to live keys (`sk_live_*`) for production

### Razorpay
- **Env vars:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- **Provider:** Razorpay
- **Setup:**
  1. Create Razorpay account (India-based payments)
  2. Get keys from Dashboard > Settings > API Keys
  3. Webhook secret from Dashboard > Webhooks
- **Current:** DEMO_* placeholder values

## Email & Notifications

### Resend
- **Env var:** `RESEND_API_KEY`
- **Provider:** Resend (transactional email)
- **Setup:** Create account at resend.com, generate API key
- **Current:** Demo key
- **Usage:** Sends verification emails, password resets, notifications

## AI & Data Services

### OpenAI
- **Env var:** `OPENAI_API_KEY`
- **Provider:** OpenAI API
- **Setup:** Create account at platform.openai.com, generate API key
- **Current:** `sk-demo-key` (non-functional)
- **Models Used:** gpt-4, gpt-3.5-turbo for AI Coach & analysis
- **Cost:** Pay-as-you-go; monitor usage in Dashboard

### Twelve Data (Market Data)
- **Env var:** `TWELVE_DATA_API_KEY`
- **Provider:** Twelve Data
- **Setup:** Create account, subscribe to market data API
- **Current:** Demo key
- **Usage:** Real-time stock/crypto prices

### Alpha Vantage (Market Data)
- **Env var:** `ALPHA_VANTAGE_API_KEY`
- **Provider:** Alpha Vantage
- **Setup:** Free tier available at alphavantage.co
- **Current:** Demo key
- **Usage:** Fallback for stock data

### Hugging Face (AI Models)
- **Env var:** `HUGGING_FACE_API_KEY`
- **Provider:** Hugging Face
- **Setup:** Create account at huggingface.co, generate token
- **Current:** Demo token
- **Usage:** NLP models for sentiment analysis

## Messaging

### Telegram Bot
- **Env var:** `TELEGRAM_BOT_TOKEN`
- **Provider:** Telegram BotFather
- **Setup:**
  1. Chat with @BotFather on Telegram
  2. Create new bot, copy token
  3. Set webhook: `https://yourdomain.com/v1/telegram/webhook`
- **Current:** DEMO_TELEGRAM_TOKEN
- **Features:** Trade alerts, account updates, portfolio checks

## Broker Integrations (Mock)

Currently using demo implementations for:
- **MT5/MT4:** Demo broker credentials (not real)
- **Binance:** Demo API keys
- **Bybit:** Demo API keys
- **cTrader:** Demo credentials

For production trading, you'll need real broker API keys stored securely per user.

## Environment Configuration

### Local Development
Env vars in `.env.local` or `.env` file (use demo keys)

### Production
1. Deploy to secure environment with encrypted secrets
2. Use environment variable management system (AWS Secrets Manager, Azure Key Vault, etc.)
3. Never commit real keys to version control
4. Rotate keys regularly
5. Monitor API usage for anomalies

### Startup Validation
The application will fail to start if required secrets are missing:
- `JWT_ACCESS_SECRET` - Required
- `JWT_REFRESH_SECRET` - Required
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` - Required
- At least one payment provider (Stripe or Razorpay) - Recommended

## Frontend Configuration

### Web App (.env)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key

## Security Best Practices

1. **Rotate Secrets Regularly**
   - JWT secrets: Every 3-6 months
   - OAuth credentials: When staff changes
   - API keys: As per provider recommendations

2. **Monitoring**
   - Track API quota usage for all services
   - Set alerts for unusual activity
   - Monitor failed auth attempts

3. **Backup & Recovery**
   - Document all API key locations
   - Create emergency restore procedures
   - Test recovery regularly

4. **Compliance**
   - Ensure data residency matches user regions
   - Verify GDPR/regulatory compliance for chosen providers
   - Document data retention policies per service

## Cost Estimation (Monthly at Scale)

| Service | Free Tier | Est. Cost@Scale |
|---------|-----------|-----------------|
| Supabase PostgreSQL | 500MB | $25-100+ |
| Upstash Redis | 10,000 commands | $10-50+ |
| Stripe | 2.9% + $0.30/transaction | 2-5% of volume |
| Razorpay | 2% | 2% of volume |
| OpenAI | - | $100-500+ |
| Resend | 100 emails/day | $20-100+ |
| Twelve Data | Limited | $25-100+ |
| Firebase | Generous free tier | $0-50+ |

Total estimated: $200-1000+/month depending on scale

## Troubleshooting

### "JWT_ACCESS_SECRET env var is required"
- Check `.env` file exists and is loaded
- Ensure variable is not empty or commented out
- Restart application after changes

### "Cannot connect to database"
- Verify `DATABASE_URL` is correct
- Check network connectivity to Neon
- Ensure IP whitelist includes your server

### "Invalid Stripe/Razorpay webhook"
- Verify webhook secret in `.env` matches provider settings
- Check webhook endpoint URL is publicly accessible
- Review webhook delivery logs in provider dashboard

## References

- [Supabase Docs](https://supabase.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Firebase Setup](https://firebase.google.com/docs)
- [OAuth Providers](https://oauth.net/code/)
- [OpenAI API Docs](https://platform.openai.com/docs)
