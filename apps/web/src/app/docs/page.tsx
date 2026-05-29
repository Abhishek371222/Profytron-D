'use client';
import { motion } from 'framer-motion';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { BookOpen, Zap, ArrowRight, Terminal, Code2, Shield, Cpu, Activity } from 'lucide-react';
import Link from 'next/link';

const quickstart = [
  { step: '01', title: 'Create an Account', desc: 'Register with your institutional email and complete identity verification.', link: '/register' },
  { step: '02', title: 'Configure API Keys', desc: 'Generate your API key from the dashboard Settings → Developer panel.', link: '/dashboard' },
  { step: '03', title: 'Connect a Broker', desc: 'Link your broker via the supported FIX/REST adapters in the Connections module.', link: '/dashboard' },
  { step: '04', title: 'Deploy Your First Strategy', desc: 'Use the Visual Builder or submit a strategy via the REST API and go live.', link: '/strategies/builder' },
];

const guides = [
  { icon: Zap, title: 'Zero-Speed Routing', href: '#', desc: 'How the execution pipe works and how to optimize for minimum slippage.' },
  { icon: Cpu, title: 'Signal Core AI Integration', href: '#', desc: 'Connecting your strategies to real-time AI signal streams.' },
  { icon: Shield, title: 'Risk Guard Configuration', href: '#', desc: 'Setting drawdown limits, kill-switches, and position size rules.' },
  { icon: Activity, title: 'Backtesting Engine', href: '#', desc: 'Running tick-level backtests with 10 years of historical market data.' },
  { icon: Code2, title: 'REST API Reference', href: '/api-reference', desc: 'Full endpoint documentation, auth, rate limits, and code samples.' },
  { icon: Terminal, title: 'WebSocket Streaming', href: '#', desc: 'Real-time market data, order updates, and position streaming.' },
];

export default function DocsPage() {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-600/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="container mx-auto px-6 max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/3 border border-white/10 text-white/50 text-[10px] font-bold tracking-[0.4em] uppercase mb-8">
              <BookOpen className="w-3 h-3 text-indigo-400" /> Documentation
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-[-0.03em] text-white leading-tight mb-6">
              Build with<br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">Precision.</span>
            </h1>
            <p className="text-lg text-white/50 max-w-xl font-medium leading-relaxed">
              Complete guides, API reference, and architecture documentation for integrating with the Profytron platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="pb-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">Quick Start</h2>
            <p className="text-white/40 mt-2">Get your first strategy running in under 10 minutes.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickstart.map((s, i) => (
              <motion.div key={s.step}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              >
                <Link href={s.link} className="block h-full p-6 rounded-2xl bg-white/2 border border-white/6 hover:border-indigo-500/40 hover:bg-white/4 transition-all group">
                  <div className="text-3xl font-mono font-bold text-indigo-500/40 group-hover:text-indigo-400 transition-colors mb-4">{s.step}</div>
                  <h3 className="font-bold text-white text-sm mb-2 group-hover:text-indigo-200 transition-colors">{s.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{s.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-16 bg-black/30 border-y border-white/5">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-5">
                <Terminal className="w-3 h-3" /> Getting Started
              </div>
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Your First API Call</h2>
              <p className="text-white/50 leading-relaxed mb-6">Authenticate and retrieve your live portfolio positions with a single REST request. All responses are JSON with consistent error shapes.</p>
              <Link href="/api-reference" className="inline-flex items-center gap-2 text-indigo-400 font-semibold text-sm hover:text-indigo-300 transition-colors">
                Full API Reference <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="rounded-2xl bg-[#0a0a12] border border-white/8 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/6 bg-white/2">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                  <span className="text-white/20 text-xs font-mono ml-2">example.ts</span>
                </div>
                <pre className="p-6 text-sm font-mono overflow-x-auto leading-relaxed">
                  <code>
                    <span className="text-indigo-400">const</span>
                    <span className="text-white"> response = </span>
                    <span className="text-cyan-400">await</span>
                    <span className="text-white"> fetch(</span>
                    {'\n'}
                    <span className="text-white">  </span>
                    <span className="text-green-400">'https://api.profytron.com/v1/positions'</span>
                    <span className="text-white">,</span>
                    {'\n'}
                    <span className="text-white">  {'{'}</span>
                    {'\n'}
                    <span className="text-white">    method: </span>
                    <span className="text-green-400">'GET'</span>
                    <span className="text-white">,</span>
                    {'\n'}
                    <span className="text-white">    headers: {'{'}</span>
                    {'\n'}
                    <span className="text-white">      </span>
                    <span className="text-green-400">'Authorization'</span>
                    <span className="text-white">: </span>
                    <span className="text-green-400">`Bearer </span>
                    <span className="text-indigo-300">$&#123;API_KEY&#125;</span>
                    <span className="text-green-400">`</span>
                    {'\n'}
                    <span className="text-white">    {'}'}</span>
                    {'\n'}
                    <span className="text-white">  {'}'}</span>
                    {'\n'}
                    <span className="text-white">);</span>
                    {'\n'}
                    <span className="text-indigo-400">const</span>
                    <span className="text-white"> data = </span>
                    <span className="text-cyan-400">await</span>
                    <span className="text-white"> response.</span>
                    <span className="text-yellow-300">json</span>
                    <span className="text-white">();</span>
                  </code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-2xl font-bold text-white mb-10 tracking-tight">Core Guides
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guides.map((g, i) => (
              <motion.div key={g.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              >
                <Link href={g.href} className="block h-full p-6 rounded-2xl bg-white/2 border border-white/6 hover:border-indigo-500/30 hover:bg-white/4 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-500/20 transition-colors">
                    <g.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-2 group-hover:text-indigo-200 transition-colors">{g.title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{g.desc}</p>
                  <div className="flex items-center gap-1 text-indigo-500/60 group-hover:text-indigo-400 text-xs font-medium mt-4 transition-colors">
                    Read guide <ArrowRight className="w-3 h-3" />
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
