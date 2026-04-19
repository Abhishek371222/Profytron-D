# Profytron Domain Deployment Guide

This guide is the shortest reliable path to deploy Profytron on your own domain with production-safe defaults.

## 1. Preflight

Run these from the repository root:

```bash
pnpm --filter profytron build
pnpm --filter api build
```

Both must pass before deploying.

## 2. Required Environment Variables

Set these for the web deployment:

- `NODE_ENV=production`
- `NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com`
- `BACKEND_API_ORIGIN=https://api.yourdomain.com`
- `NEXT_PUBLIC_API_URL=/api`
- `NEXT_PUBLIC_ENABLE_MOCK_API=false`

Set backend production variables in your API environment as well (database, JWT, Stripe, Redis, mail).

## 3. DNS Setup

Use your DNS provider and create:

- `A` record: `@` -> your web server IP
- `CNAME` record: `www` -> `@` (or your platform-provided target)
- `A` or `CNAME` for API subdomain: `api` -> backend host

Recommended final host mapping:

- `https://yourdomain.com` -> Next.js web app
- `https://api.yourdomain.com` -> Nest API

## 4. Web Deployment (Next.js)

The web app now uses standalone output (`apps/web/next.config.ts`), so deploy with:

```bash
pnpm --filter profytron build
cd apps/web
node .next/standalone/server.js
```

For Docker deployments, copy:

- `.next/standalone`
- `.next/static`
- `public`

## 5. TLS and Reverse Proxy

Put NGINX/Caddy/Cloudflare in front of both hosts and enforce HTTPS.

Minimum reverse-proxy requirements:

- Redirect HTTP -> HTTPS
- Forward `X-Forwarded-Proto`, `X-Forwarded-For`, and `Host`
- Keep gzip/brotli enabled
- Cache static assets aggressively

## 6. Post-Deployment Smoke Tests

Run after DNS and deploy:

```bash
curl -I https://yourdomain.com
curl -I https://yourdomain.com/dashboard
curl -I https://yourdomain.com/affiliate
curl -I https://api.yourdomain.com/health
```

Then verify in browser:

- Login and dashboard load
- Affiliate page copy/share flow works
- Dashboard candlestick chart updates live and timeframe switches work

## 7. Production Launch Checklist

- `NEXT_PUBLIC_ENABLE_MOCK_API` is `false`
- No `.env` test keys in production
- Web and API logs are monitored
- Alerts are configured for 5xx and latency spikes
- Automatic backups are enabled for database
