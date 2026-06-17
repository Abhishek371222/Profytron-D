'use client';

import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { BookOpen, Zap, ArrowRight, Terminal, Code2, Shield, Cpu, Activity } from 'lucide-react';
import Link from 'next/link';

const quickstart = [
  { step: '01', title: 'Create an Account', desc: 'Register with your institutional email and complete identity verification.', link: '/register' },
  { step: '02', title: 'Configure API Keys', desc: 'Generate your API key from the dashboard Settings → Developer panel.', link: '/dashboard' },
  { step: '03', title: 'Connect a Broker', desc: 'Link your broker via the supported FIX/REST adapters in the Connections module.', link: '/copy-trading' },
  { step: '04', title: 'Deploy Your First Strategy', desc: 'Use the Visual Builder or submit a strategy via the REST API and go live.', link: '/strategies/builder' },
];

const guides = [
  { icon: Zap, title: 'Copy Trading Setup', href: '/docs#copy-trading', desc: 'Connect MT5 and subscribe to verified strategies in minutes.' },
  { icon: Cpu, title: 'AI Risk Engine', href: '/analytics/risk', desc: 'Drawdown limits, kill-switches, and position size rules.' },
  { icon: Shield, title: 'Broker Connect', href: '/copy-trading', desc: 'Link paper or live MT4/MT5 accounts from 20+ brokers.' },
  { icon: Activity, title: 'Marketplace Strategies', href: '/marketplace', desc: 'Browse verified track records before you subscribe.' },
  { icon: Code2, title: 'REST API Reference', href: '/api-reference', desc: 'Full endpoint documentation, auth, rate limits, and code samples.' },
  { icon: Terminal, title: 'Broker Setup Guides', href: '/brokers/ic-markets', desc: 'Step-by-step MT5 server setup for popular brokers.' },
];

export default function DocsPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[0.04] via-background to-background scroll-mt-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(700px,100vw)] h-[280px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="page-container max-w-5xl py-16 sm:py-20 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-5">
              Build with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">
                Precision.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Complete guides, API reference, and architecture documentation for integrating with the Profytron platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 sm:py-20 scroll-mt-28">
        <div className="page-container max-w-5xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Quick Start</h2>
            <p className="text-muted-foreground mt-2 text-base">
              Get your first strategy running in under 10 minutes.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickstart.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Link
                  href={s.link}
                  className="block h-full p-6 rounded-[20px] bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <div className="text-3xl font-mono font-bold text-primary/50 group-hover:text-primary transition-colors mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-16 sm:py-20 bg-muted/40 border-y border-border scroll-mt-28">
        <div className="page-container max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-5">
                <Terminal className="w-3.5 h-3.5" />
                Getting Started
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 tracking-tight">
                Your First API Call
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 text-base">
                Authenticate and retrieve your live portfolio positions with a single REST request. All responses are JSON with consistent error shapes.
              </p>
              <Link
                href="/api-reference"
                className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:underline underline-offset-4"
              >
                Full API Reference
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="rounded-[20px] bg-[#0b1020] dark:bg-[#060912] border border-border overflow-hidden shadow-lg">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10 bg-white/[0.03]">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="text-white/40 text-xs font-mono ml-2">example.ts</span>
                </div>
                <pre className="p-5 sm:p-6 text-[13px] font-mono overflow-x-auto leading-relaxed text-slate-200">
                  <code>{`const response = await fetch(
  'https://api.profytron.com/v1/positions',
  {
    method: 'GET',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`
    }
  }
);
const data = await response.json();`}</code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-16 sm:py-20 scroll-mt-28" id="copy-trading">
        <div className="page-container max-w-5xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl font-bold text-foreground mb-10 tracking-tight"
          >
            Core Guides
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guides.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
              >
                <Link
                  href={g.href}
                  className="block h-full p-6 rounded-[20px] bg-card border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                    <g.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{g.desc}</p>
                  <div className="flex items-center gap-1 text-primary text-xs font-medium mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                    Read guide
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
