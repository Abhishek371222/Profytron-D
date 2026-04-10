'use client';

import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Cpu, 
  Layers, 
  Database,
  Search,
  Workflow,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeUp, StaggerList } from '@/components/animations';
import { Tilt } from '@/components/ui/Interactions';
import Link from 'next/link';

const features = [
  {
    title: 'Precision Execution',
    description: 'Ultra-low latency execution engine optimized for institutional-volume trading.',
    icon: '/images/icon-precision.png',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    size: 'col-span-1 md:col-span-2',
  },
  {
    title: 'AI Signal Core',
    description: 'Advanced neural networks processing petabytes of market data in real-time.',
    icon: '/images/icon-ai.png',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
    size: 'col-span-1',
  },
  {
    title: 'Risk Guard',
    description: 'Dynamic risk management protocols that adapt to market volatility instantly.',
    icon: '/images/icon-risk.png',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    size: 'col-span-1',
  },
  {
    title: 'Strategy Lab',
    description: 'No-code visual builder for complex algorithmic strategies and backtesting.',
    icon: Workflow,
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    size: 'col-span-1 md:col-span-2',
  },
  {
    title: 'Deep Liquidity',
    description: 'Aggregated liquidity from 120+ top-tier exchanges and OTC desks.',
    icon: Layers,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10',
    size: 'col-span-1',
  },
  {
    title: 'Neural Analytics',
    description: 'Predictive modeling and sentiment analysis across social and news feeds.',
    icon: BarChart3,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-400/10',
    size: 'col-span-1',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-40 relative overflow-hidden bg-black">
      {/* Background Architecture */}
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-p/10 to-transparent blur-[120px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay opacity-40" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mb-32">
          <FadeUp>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-p/10 border border-p/20 text-p text-[10px] font-black uppercase tracking-[0.5em] mb-8 font-syne">
               <Cpu className="w-4 h-4" />
               Industrial_Protocol_v4.0
            </div>
            <h2 className="text-6xl md:text-8xl font-syne font-black mb-10 leading-[0.9] tracking-tighter uppercase italic">
              Advanced <span className="text-white/10 outline-text">Infrastructure,</span> <br />
              <span className="text-p drop-shadow-[0_0_20px_#6366f1]">Engineered for Alpha.</span>
            </h2>
            <p className="text-white/40 text-2xl max-w-2xl leading-relaxed italic font-syne font-medium tracking-tight">
              Our ecosystem merges institutional execution logic with frontier 
              neural networks into a single, high-performance habitat.
            </p>
          </FadeUp>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Feature: Precision Execution */}
            <div className="col-span-1 md:col-span-8 group">
                <Tilt maxRotation={3}>
                    <motion.div className="relative p-12 rounded-[48px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-700 min-h-[500px] flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] height-[400px] bg-p/10 blur-[120px] rounded-full group-hover:bg-p/20 transition-all duration-1000" />
                        <div className="absolute -inset-px border-gradient group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10">
                            <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mb-12 group-hover:rotate-6 transition-transform shadow-2xl">
                                <Zap className="w-10 h-10 text-p fill-p/20" />
                            </div>
                            <h3 className="text-5xl font-syne font-black text-white mb-6 uppercase italic tracking-tighter">Precision Execution</h3>
                            <p className="text-xl text-white/40 max-w-xl font-syne font-medium tracking-tight leading-relaxed italic">
                                Institutional-volume order routing synchronized across 120+ global nodes with sub-millisecond heartbeat verification.
                            </p>
                        </div>

                        <div className="relative z-10 mt-12 flex items-center justify-between">
                            <Link href="/dashboard" className="group/link flex items-center gap-6">
                                <span className="text-xs font-black uppercase tracking-[0.4em] text-white/40 group-hover/link:text-p transition-colors font-syne">Deploy_Interface</span>
                                <div className="w-24 h-px bg-white/10 group-hover/link:w-32 group-hover/link:bg-p transition-all duration-700" />
                            </Link>
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-p animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                            </div>
                        </div>
                        
                        {/* Decorative scanlines */}
                        <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
                    </motion.div>
                </Tilt>
            </div>

            {/* AI Signal Core */}
            <div className="col-span-1 md:col-span-4 group">
               <Tilt maxRotation={5}>
                    <motion.div className="relative p-10 rounded-[48px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-700 min-h-[500px] flex flex-col justify-between overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-[300px] height-[300px] bg-indigo-500/10 blur-[100px] rounded-full" />
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center mb-10 shadow-2xl">
                                <Cpu className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h3 className="text-4xl font-syne font-black text-white mb-6 uppercase italic tracking-tighter leading-none">Neural <br />Signal Core</h3>
                            <p className="text-lg text-white/40 font-syne font-medium tracking-tight leading-relaxed italic">
                                Advanced multi-modal transformers processing petabytes of orderbook depth in perpetual cycles.
                            </p>
                        </div>

                        <Link href="/analytics" className="relative z-10 text-[10px] font-black uppercase tracking-[0.4em] text-white/30 group-hover:text-p transition-colors font-syne">
                           Access_Pulse
                        </Link>
                    </motion.div>
               </Tilt>
            </div>

            {/* Risk Guard */}
            <div className="col-span-1 md:col-span-4 group">
                <Tilt maxRotation={5}>
                    <motion.div className="relative p-10 rounded-[48px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-700 h-[450px] flex flex-col justify-between overflow-hidden">
                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center mb-10 shadow-2xl">
                                <Shield className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-3xl font-syne font-black text-white mb-4 uppercase italic tracking-tighter">Sentinel Risk</h3>
                            <p className="text-base text-white/40 font-syne font-medium tracking-tight leading-relaxed italic">
                                Adaptive circuit-breakers and volatility shielding protocols active 24/7.
                            </p>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-emerald-400/20 animate-pulse" />
                        </div>
                    </motion.div>
                </Tilt>
            </div>

            {/* Strategy Lab */}
            <div className="col-span-1 md:col-span-8 group">
                <Tilt maxRotation={3}>
                    <motion.div className="relative p-12 rounded-[48px] border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent hover:bg-white/[0.05] transition-all duration-700 h-[450px] flex flex-col justify-between overflow-hidden group">
                        <div className="absolute inset-0 bg-p/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-start md:items-center">
                            <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Workflow className="w-10 h-10 text-p" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-5xl font-syne font-black text-white uppercase italic tracking-tighter">IDE Strategy Lab</h3>
                                <p className="text-xl text-white/40 font-syne font-medium tracking-tight leading-relaxed italic max-w-lg">
                                    Architect complex multi-leg algorithms via institutional visual flow charts. No-code logic, enterprise-grade execution.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-6">
                            <Link href="/strategies/builder" className="h-14 px-8 bg-p hover:bg-indigo-500 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] font-syne text-white transition-all shadow-xl shadow-p/20 group-hover:shadow-p/40">
                                Open_Assembler
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <span className="text-[10px] text-white/20 font-black tracking-widest uppercase font-syne">v0.9.4 Beta_Preview</span>
                        </div>
                    </motion.div>
                </Tilt>
            </div>
        </div>
      </div>
    </section>
  );
}
