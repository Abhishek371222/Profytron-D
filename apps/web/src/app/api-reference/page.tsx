'use client';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingBand,
  MarketingCard,
  MarketingGrid,
} from '@/components/marketing/MarketingPage';
import { Code2, Lock, Zap, Terminal, ArrowRight } from 'lucide-react';

const endpoints = [
  { method: 'GET', path: '/v1/positions', description: 'List all open positions for the authenticated account', auth: true },
  { method: 'POST', path: '/v1/orders', description: 'Submit a new market, limit, or stop order', auth: true },
  { method: 'DELETE', path: '/v1/orders/:id', description: 'Cancel a pending order by its unique identifier', auth: true },
  { method: 'GET', path: '/v1/strategies', description: 'Retrieve all deployed strategies and their active status', auth: true },
  { method: 'POST', path: '/v1/strategies/:id/backtest', description: 'Trigger a backtest run over a specified date range', auth: true },
  { method: 'GET', path: '/v1/signals/live', description: 'Stream real-time AI signal events for subscribed instruments', auth: true },
  { method: 'GET', path: '/v1/market/quote', description: 'Get the latest bid/ask quote for a given symbol', auth: false },
  { method: 'GET', path: '/v1/market/ohlc', description: 'Retrieve OHLCV candlestick data for historical analysis', auth: false },
  { method: 'POST', path: '/v1/auth/login', description: 'Authenticate with email/password and receive a JWT token pair', auth: false },
  { method: 'POST', path: '/v1/auth/refresh', description: 'Exchange a refresh token for a new access token', auth: false },
];

const methodColors: Record<string, string> = {
  GET: 'text-chart-5 bg-chart-5/10 border-chart-5/20',
  POST: 'text-chart-3 bg-chart-3/10 border-chart-3/20',
  DELETE: 'text-red-400 bg-red-400/10 border-red-400/20',
  PATCH: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
};

const limits = [
  { tier: 'Free / Starter', limit: '60 req/min', burst: '120' },
  { tier: 'Pro / Business', limit: '600 req/min', burst: '1,200' },
  { tier: 'Enterprise', limit: 'Unlimited', burst: 'Unlimited' },
];

export default function ApiReferencePage() {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="API Reference"
        eyebrowIcon={Code2}
        title="RESTful API"
        titleAccent="Reference."
        description="Complete HTTP API documentation. All endpoints accept and return JSON. Authentication uses Bearer tokens via JWT."
        meta={
          <div className="flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
            <span className="rounded-lg border border-[var(--card-border)] bg-card px-3 py-1">api.profytron.com</span>
            <span className="rounded-lg border border-[var(--card-border)] bg-card px-3 py-1">v1</span>
            <span className="rounded-lg border border-[var(--card-border)] bg-card px-3 py-1">HTTPS / WSS</span>
          </div>
        }
      />

      <MarketingSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="mb-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary" />
                <h2 className="dash-section-title text-xl">Authentication</h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">All authenticated endpoints require a Bearer token in the Authorization header. Points expire after <span className="font-mono text-foreground">1h</span>. Use the refresh endpoint to obtain a new access token.</p>
              <div className="space-y-2">
                {[
                  { label: 'Access token TTL', val: '1 hour' },
                  { label: 'Refresh token TTL', val: '7 days' },
                  { label: 'Algorithm', val: 'RS256 JWT' },
                  { label: 'Scopes', val: 'read, trade, admin' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-[var(--card-border)] py-2 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono text-xs text-foreground">{item.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}>
              <MarketingCard className="overflow-hidden bg-muted/40 p-0 font-mono">
                <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-muted/30 px-5 py-3">
                  <span className="text-xs text-muted-foreground">Request Header</span>
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-foreground">
{`Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json
X-Profytron-Version: 2026-04`}
                </pre>
              </MarketingCard>
            </motion.div>
          </div>
      </MarketingSection>

      <MarketingBand>
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="dash-section-title mb-8 text-xl">Endpoints
          </motion.h2>
          <div className="flex flex-col gap-2">
            {endpoints.map((ep, i) => (
              <motion.div key={`${ep.method}-${ep.path}`}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} viewport={{ once: true }}
              >
                <MarketingCard hover className="group flex cursor-pointer items-center gap-5 p-4">
                <span className={`w-16 rounded border px-2.5 py-1 text-center font-mono text-[10px] font-bold uppercase ${methodColors[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="shrink-0 font-mono text-sm text-primary transition-colors group-hover:text-primary-hover">{ep.path}</code>
                <span className="hidden flex-1 truncate text-sm text-muted-foreground md:block">{ep.description}</span>
                {ep.auth && (
                  <div className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" /> Auth
                  </div>
                )}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </MarketingCard>
              </motion.div>
            ))}
          </div>
      </MarketingBand>

      <MarketingSection>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="mb-8 flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="dash-section-title text-xl">Rate Limits</h2>
            </div>
            <MarketingGrid cols={3}>
              {limits.map((l, i) => (
                <motion.div key={l.tier}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                >
                  <MarketingCard>
                  <div className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">{l.tier}</div>
                  <div className="mb-1 font-mono text-2xl font-bold text-foreground">{l.limit}</div>
                  <div className="text-xs text-muted-foreground">Burst cap: {l.burst}</div>
                  </MarketingCard>
                </motion.div>
              ))}
            </MarketingGrid>
            <p className="mt-6 text-sm text-muted-foreground">Rate limit headers are returned on every response: <code className="font-mono text-xs text-primary">X-RateLimit-Remaining</code>, <code className="font-mono text-xs text-primary">X-RateLimit-Reset</code></p>
          </motion.div>
      </MarketingSection>
    </PublicPageLayout>
  );
}
