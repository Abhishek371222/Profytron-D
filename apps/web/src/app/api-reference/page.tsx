'use client';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { Code2, Lock, Zap, Terminal, ArrowRight, CheckCircle } from 'lucide-react';

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
  { tier: 'Developer Node', limit: '60 req/min', burst: '120' },
  { tier: 'Alpha Desk', limit: '600 req/min', burst: '1,200' },
  { tier: 'Institution', limit: 'Unlimited', burst: 'Unlimited' },
];

export default function ApiReferencePage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-62.5 bg-chart-5/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/3 border border-border text-foreground/50 text-micro font-bold tracking-[0.4em] uppercase mb-8">
              <Code2 className="w-3 h-3 text-chart-5" /> API_Reference
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-[-0.03em] text-foreground leading-tight mb-6">
              RESTful API<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-chart-5 to-primary">Reference.</span>
            </h1>
            <p className="text-lg text-foreground/50 max-w-xl font-medium leading-relaxed">
              Complete HTTP API documentation. All endpoints accept and return JSON. Authentication uses Bearer tokens via JWT.
            </p>
            <div className="flex items-center gap-4 mt-6 text-xs font-mono text-foreground/40">
              <span className="px-3 py-1 rounded bg-foreground/4 border border-border">Base URL: api.profytron.com</span>
              <span className="px-3 py-1 rounded bg-foreground/4 border border-border">Version: v1</span>
              <span className="px-3 py-1 rounded bg-foreground/4 border border-border">System: HTTPS / WSS</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Auth */}
      <section className="pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Authentication</h2>
              </div>
              <p className="text-foreground/50 text-sm leading-relaxed mb-4">All authenticated endpoints require a Bearer token in the Authorization header. Points expire after <span className="text-foreground/70 font-mono">1h</span>. Use the refresh endpoint to obtain a new access token.</p>
              <div className="space-y-2">
                {[
                  { label: 'Access token TTL', val: '1 hour' },
                  { label: 'Refresh token TTL', val: '7 days' },
                  { label: 'Algorithm', val: 'RS256 JWT' },
                  { label: 'Scopes', val: 'read, trade, admin' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border text-sm">
                    <span className="text-foreground/40">{item.label}</span>
                    <span className="text-foreground/70 font-mono text-xs">{item.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}>
              <div className="rounded-2xl bg-[#0a0a12] border border-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-foreground/2">
                  <span className="text-foreground/20 text-xs font-mono">Request Header</span>
                  <Terminal className="w-3.5 h-3.5 text-foreground/20" />
                </div>
                <pre className="p-5 text-xs font-mono text-foreground/70 leading-relaxed overflow-x-auto">
{`Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Content-Type: application/json
X-Profytron-Version: 2026-04`}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-16 bg-black/20 border-y border-border">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-xl font-bold text-foreground mb-8 tracking-tight">Endpoints
          </motion.h2>
          <div className="flex flex-col gap-2">
            {endpoints.map((ep, i) => (
              <motion.div key={`${ep.method}-${ep.path}`}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }} viewport={{ once: true }}
                className="flex items-center gap-5 p-4 rounded-xl bg-foreground/2 border border-border hover:border-border transition-all group cursor-pointer"
              >
                <span className={`px-2.5 py-1 rounded text-micro font-bold font-mono border uppercase w-16 text-center ${methodColors[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="text-primary text-sm font-mono group-hover:text-indigo-200 transition-colors flex-shrink-0">{ep.path}</code>
                <span className="text-foreground/40 text-sm flex-1 truncate hidden md:block">{ep.description}</span>
                {ep.auth && (
                  <div className="flex items-center gap-1 text-micro text-foreground/25 font-mono shrink-0">
                    <Lock className="w-2.5 h-2.5" /> Auth
                  </div>
                )}
                <ArrowRight className="w-4 h-4 text-foreground/10 group-hover:text-primary transition-colors shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground tracking-tight">Rate Limits</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {limits.map((l, i) => (
                <motion.div key={l.tier}
                  initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  className="p-6 rounded-2xl bg-foreground/2 border border-border"
                >
                  <div className="text-xs font-mono uppercase tracking-widest text-foreground/40 mb-3">{l.tier}</div>
                  <div className="text-2xl font-bold text-foreground font-mono mb-1">{l.limit}</div>
                  <div className="text-xs text-foreground/30">Burst cap: {l.burst}</div>
                </motion.div>
              ))}
            </div>
            <p className="mt-6 text-foreground/30 text-sm">Rate limit headers are returned on every response: <code className="font-mono text-primary text-xs">X-RateLimit-Remaining</code>, <code className="font-mono text-primary text-xs">X-RateLimit-Reset</code></p>
          </motion.div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
