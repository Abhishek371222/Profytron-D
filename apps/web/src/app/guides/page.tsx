'use client';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { TrendingUp, BookOpen, ArrowRight, BarChart2, Shield, Cpu, Clock } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { name: 'Algorithmic Strategies', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
  { name: 'Risk Management', icon: Shield, color: 'text-chart-5', bg: 'bg-chart-5/10 border-chart-5/20' },
  { name: 'AI & Signal Analysis', icon: Cpu, color: 'text-chart-2', bg: 'bg-chart-2/10 border-chart-2/20' },
  { name: 'Market Microstructure', icon: BarChart2, color: 'text-chart-3', bg: 'bg-chart-3/10 border-chart-3/20' },
];

const guides = [
  { category: 'Algorithmic Strategies', level: 'Beginner', title: 'Introduction to Algorithmic Trading', desc: 'The fundamentals of systematic trading: how algorithms replace discretion and why execution consistency creates an edge over time.', readTime: '10 min', icon: TrendingUp },
  { category: 'Risk Management', level: 'Intermediate', title: 'Kelly Criterion & Position Sizing', desc: 'How to size positions to maximize geometric growth without risking ruin — the mathematics behind institutional bankroll management.', readTime: '14 min', icon: Shield },
  { category: 'Market Microstructure', level: 'Advanced', title: 'Order Flow Toxicity & Adverse Selection', desc: 'Understanding why certain order flows are exploited by market makers, and how to measure the "toxicity" of your execution.', readTime: '18 min', icon: BarChart2 },
  { category: 'Algorithmic Strategies', level: 'Intermediate', title: 'Mean Reversion vs. Momentum Strategies', desc: 'When markets mean-revert and when they trend — a framework for regime detection and strategy selection.', readTime: '12 min', icon: TrendingUp },
  { category: 'AI & Signal Analysis', level: 'Advanced', title: 'Building a Sentiment-Driven Signal Pipeline', desc: 'Ingesting news, social, and alternative data sources into a real-time scoring pipeline that feeds execution logic.', readTime: '20 min', icon: Cpu },
  { category: 'Risk Management', level: 'Beginner', title: 'Understanding Losing period & Maximum Risk', desc: 'How to measure, monitor, and set hard limits on portfolio drawdown — the system behind Profytron\'s Safety Check.', readTime: '8 min', icon: Shield },
  { category: 'Market Microstructure', level: 'Intermediate', title: 'The Economics of Market Making', desc: 'Why spreads exist, how market makers profit from them, and how directional traders can avoid being picked off.', readTime: '16 min', icon: BarChart2 },
  { category: 'AI & Signal Analysis', level: 'Beginner', title: 'MACD, RSI, and Signal Stacking', desc: 'Classic technical indicators explained rigorously — and how Signal Core AI validates or overrides them with multi-modal inputs.', readTime: '9 min', icon: Cpu },
];

const levelColors: Record<string, string> = {
  Beginner: 'text-chart-3 bg-chart-3/10 border-chart-3/20',
  Intermediate: 'text-primary bg-primary/10 border-primary/20',
  Advanced: 'text-chart-2 bg-chart-2/10 border-chart-2/20',
};

export default function GuidesPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-150 h-[300px] bg-primary/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/3 border border-border text-foreground/50 text-micro font-bold tracking-[0.4em] uppercase mb-8">
              <BookOpen className="w-3 h-3 text-primary" /> Market_Guides
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-[-0.03em] text-foreground leading-tight mb-6">
              Trade Smarter,<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-chart-5">Not Harder.</span>
            </h1>
            <p className="text-lg text-foreground/50 max-w-xl font-medium leading-relaxed">
              Practitioner-written guides on algorithmic strategies, risk management, market microstructure, and AI signal analysis.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-16">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <motion.div key={cat.name}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className={`p-5 rounded-2xl border ${cat.bg} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                <cat.icon className={`w-5 h-5 ${cat.color} mb-3`} />
                <div className={`text-sm font-semibold ${cat.color}`}>{cat.name}</div>
                <div className="text-foreground/30 text-xs mt-1">{guides.filter(g => g.category === cat.name).length} guides</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-16 bg-black/20 border-y border-border">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {guides.map((guide, i) => (
              <motion.article key={guide.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }} viewport={{ once: true }}
                className="group p-6 rounded-2xl bg-foreground/2 border border-border hover:border-primary/30 hover:bg-foreground/4 transition-all cursor-pointer flex gap-5"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <guide.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-micro font-bold uppercase tracking-wider border ${levelColors[guide.level]}`}>{guide.level}</span>
                    <span className="text-foreground/20 text-micro font-mono flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{guide.readTime}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-sm leading-snug mb-2 group-hover:text-indigo-200 transition-colors">{guide.title}</h3>
                  <p className="text-foreground/40 text-xs leading-relaxed">{guide.desc}</p>
                  <div className="flex items-center gap-1 text-primary/60 group-hover:text-primary text-xs font-medium mt-3 transition-colors">
                    Read guide <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Ready to Deploy?</h2>
            <p className="text-foreground/50 mb-8">Put the theory to work. Build and backtest your first strategy in minutes.</p>
            <Link href="/register" className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary text-foreground rounded-xl font-semibold transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              Start Building <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
