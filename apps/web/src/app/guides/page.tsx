'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import {
  MarketingHero,
  MarketingSection,
  MarketingBand,
  MarketingGrid,
  MarketingCard,
  MarketingCta,
} from '@/components/marketing/MarketingPage';
import { TrendingUp, BookOpen, ArrowRight, BarChart2, Shield, Cpu, Clock } from 'lucide-react';
import { GUIDES } from '@/lib/guides/content';

const categoryIcons: Record<string, typeof TrendingUp> = {
  'Algorithmic Strategies': TrendingUp,
  'Risk Management': Shield,
  'AI & Signal Analysis': Cpu,
  'Market Microstructure': BarChart2,
};

const categories = [
  { name: 'Algorithmic Strategies', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  { name: 'Risk Management', icon: Shield, color: 'text-[var(--brand-crimson)]', bg: 'bg-[color-mix(in_srgb,var(--brand-crimson)_10%,transparent)] border-[color-mix(in_srgb,var(--brand-crimson)_20%,transparent)]' },
  { name: 'AI & Signal Analysis', icon: Cpu, color: 'text-chart-2', bg: 'bg-chart-2/10 border-chart-2/20' },
  { name: 'Market Microstructure', icon: BarChart2, color: 'text-chart-3', bg: 'bg-chart-3/10 border-chart-3/20' },
];

const guides = GUIDES.map((g) => ({ ...g, icon: categoryIcons[g.category] ?? TrendingUp }));

const levelColors: Record<string, string> = {
  Beginner: 'text-chart-3 bg-chart-3/10 border-chart-3/20',
  Intermediate: 'text-primary bg-primary/10 border-primary/20',
  Advanced: 'text-chart-2 bg-chart-2/10 border-chart-2/20',
};

export default function GuidesPage() {
  return (
    <PublicPageLayout>
      <MarketingHero
        eyebrow="Market Guides"
        eyebrowIcon={BookOpen}
        title="Trade Smarter,"
        titleAccent="Not Harder."
        description="Practitioner-written guides on algorithmic strategies, risk management, market microstructure, and AI signal analysis."
      />

      <MarketingSection>
        <MarketingGrid cols={4}>
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <MarketingCard className={`border ${cat.bg}`} hover>
                <cat.icon className={`h-5 w-5 ${cat.color} mb-3`} />
                <div className={`text-sm font-semibold ${cat.color}`}>{cat.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {guides.filter((g) => g.category === cat.name).length} guides
                </div>
              </MarketingCard>
            </motion.div>
          ))}
        </MarketingGrid>
      </MarketingSection>

      <MarketingBand>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {guides.map((guide, i) => (
            <motion.article
              key={guide.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <Link href={`/guides/${guide.slug}`} className="group block h-full">
                <MarketingCard hover className="flex h-full gap-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <guide.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${levelColors[guide.level]}`}>
                        {guide.level}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {guide.readTime}
                      </span>
                    </div>
                    <h3 className="mb-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {guide.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{guide.desc}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary/80 transition-colors group-hover:text-primary">
                      Read guide <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </MarketingCard>
              </Link>
            </motion.article>
          ))}
        </div>
      </MarketingBand>

      <MarketingCta
        title="Ready to"
        titleAccent="Deploy?"
        description="Put the theory to work. Build and backtest your first strategy in minutes."
      >
        <Link
          href="/register"
          className="inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-4 font-semibold text-primary-foreground shadow-[0_0_30px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all hover:bg-primary-hover"
        >
          Start Building <ArrowRight className="h-4 w-4" />
        </Link>
      </MarketingCta>
    </PublicPageLayout>
  );
}
