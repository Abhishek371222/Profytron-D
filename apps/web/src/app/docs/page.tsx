'use client';

import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingGrid,
  MarketingCard,
  MarketingBand,
} from '@/components/marketing/MarketingPage';
import { BookOpen, Zap, ArrowRight, Terminal, Code2, Shield, Cpu, Activity } from 'lucide-react';
import Link from 'next/link';

const quickstart = [
  { step: '01', title: 'Create an Account', desc: 'Register with your institutional email and complete identity verification.', link: '/register' },
  { step: '02', title: 'Configure API Keys', desc: 'Generate your API key from the dashboard Settings → Developer panel.', link: '/dashboard' },
  { step: '03', title: 'Connect a Broker', desc: 'Link your broker via the supported FIX/REST adapters in the Connections module.', link: '/get-bots' },
  { step: '04', title: 'Deploy Your First Strategy', desc: 'Use the Visual Builder or submit a strategy via the REST API and go live.', link: '/strategies/builder' },
];

const guides = [
  { icon: Zap, title: 'Get Bots Setup', href: '/docs#get-bots', desc: 'Connect MT5 and buy verified bots in minutes.' },
  { icon: Cpu, title: 'AI Risk Engine', href: '/analytics/risk', desc: 'Drawdown limits, kill-switches, and position size rules.' },
  { icon: Shield, title: 'Broker Connect', href: '/get-bots', desc: 'Link paper or live MT4/MT5 accounts from 20+ brokers.' },
  { icon: Activity, title: 'Marketplace Strategies', href: '/marketplace', desc: 'Browse verified track records before you subscribe.' },
  { icon: Code2, title: 'REST API Reference', href: '/api-reference', desc: 'Full endpoint documentation, auth, rate limits, and code samples.' },
  { icon: Terminal, title: 'Broker Setup Guides', href: '/brokers', desc: 'Step-by-step MT5 server setup for 20+ supported brokers.' },
];

export default function DocsPage() {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Documentation"
        eyebrowIcon={BookOpen}
        title="Build with"
        titleAccent="Precision."
        description="Complete guides, API reference, and architecture documentation for integrating with the Profytron platform."
      />

      <MarketingSection>
        <h2 className="brand-display-heading mb-2 text-2xl sm:text-3xl">Quick Start</h2>
        <p className="mb-8 text-muted-foreground">Get your first strategy running in under 10 minutes.</p>
        <MarketingGrid cols={4}>
            {quickstart.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
              >
                <Link href={s.link} className="block h-full group">
                  <MarketingCard hover className="h-full">
                    <div className="mb-4 font-mono text-3xl font-bold text-primary/60 transition-colors group-hover:text-primary">
                      {s.step}
                    </div>
                    <h3 className="dash-section-title mb-2 text-sm group-hover:text-primary">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  </MarketingCard>
                </Link>
              </motion.div>
            ))}
        </MarketingGrid>
      </MarketingSection>

      <MarketingBand>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="landing-eyebrow mb-5">
                <Terminal className="h-3.5 w-3.5" />
                Getting Started
              </span>
              <h2 className="brand-display-heading mb-4 text-2xl sm:text-3xl">Your First API Call</h2>
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
      </MarketingBand>

      <MarketingSection id="get-bots">
          <h2 className="brand-display-heading mb-8 text-2xl sm:text-3xl">Core Guides</h2>
          <MarketingGrid cols={3}>
            {guides.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
              >
                <Link href={g.href} className="block h-full group">
                  <MarketingCard hover className="h-full">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <g.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="dash-section-title mb-2 text-sm group-hover:text-primary">{g.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{g.desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                      Read guide <ArrowRight className="h-3 w-3" />
                    </div>
                  </MarketingCard>
                </Link>
              </motion.div>
            ))}
          </MarketingGrid>
      </MarketingSection>
    </PublicPageLayout>
  );
}
