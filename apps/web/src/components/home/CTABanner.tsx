'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Shield, Rocket } from 'lucide-react';
import Link from 'next/link';
import { FadeUp } from '@/components/animations';

export function CTABanner() {
 return (
 <section className="py-40 relative overflow-hidden bg-black">
 <div className="container mx-auto px-6">
 <div className="relative rounded-[64px] bg-white/[0.02] border border-white/5 p-20 md:p-32 overflow-hidden group backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,1)]">
 {/* Immersive Background Architecture */}
 <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-p/20 blur-[180px] rounded-full -mr-96 -mt-96 group-hover:bg-p/30 transition-all duration-1000" />
 <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full -ml-48 -mb-48" />
 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay pointer-events-none" />
 <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />

 <div className="relative z-10 text-center max-w-5xl mx-auto">
 <FadeUp>
 <div className="inline-flex items-center gap-4 px-6 py-2 rounded-xl bg-p/10 border border-p/20 text-p text-xs font-semibold uppercase tracking-[0.6em] mb-12 relative overflow-hidden">
 <div className="absolute h-full w-px bg-p/50 right-0 animate-scanline" />
 <Rocket className="w-5 h-5 fill-p animate-pulse" />
 <span>Next_Generation_Neural_Stack_v4.0</span>
 </div>
 
 <h2 className="text-6xl md:text-[110px] font-semibold mb-12 leading-tight tracking-tight uppercase text-white">
 Engineeri<span className="text-white/10 outline-text">ng</span> <br />
 Your <span className="text-p drop-shadow-[0_0_40px_rgba(99,102,241,0.6)]">Epoch.</span>
 </h2>
 
 <p className="text-2xl md:text-3xl text-white/40 mb-20 leading-relaxed max-w-3xl mx-auto font-medium tracking-tight">
 Synchronize with the world&apos;s most advanced trading architecture. 
 Deploy Alpha. Eliminate Latency. Own the Market.
 </p>

 <div className="flex flex-wrap items-center justify-center gap-10">
 <Link href="/register">
 <Button size="lg" className="h-24 px-16 text-2xl bg-p hover:bg-indigo-500 rounded-[32px] group shadow-[0_30px_60px_rgba(99,102,241,0.5)] transition-all duration-700 font-semibold tracking-[0.1em] uppercase relative overflow-hidden">
 <span className="relative z-10 flex items-center gap-4">
 Initialize Core
 <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform duration-500" />
 </span>
 <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
 </Button>
 </Link>
 <Link href="/dashboard">
 <Button size="lg" variant="ghost" className="h-24 px-16 text-2xl border-2 border-white/5 bg-white/[0.02] hover:bg-white/[0.08] rounded-[32px] font-semibold uppercase text-white/40 hover:text-white transition-all shadow-inner tracking-widest">
 Access Sandbox
 </Button>
 </Link>
 </div>

 <div className="mt-24 pt-16 border-t border-white/5 flex flex-wrap justify-center gap-20 opacity-30">
 {[
 { icon: Shield, label: 'PULSE_SHIELD_ACTIVE' },
 { icon: Zap, label: 'SUB_MS_SYNCHRONIZED' },
 { icon: Rocket, label: 'DIRECT_ALPHA_STREAM' }
 ].map((item, i) => (
 <div key={i} className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.4em] group hover:text-white transition-colors">
 <item.icon className="w-5 h-5 text-p" />
 {item.label}
 </div>
 ))}
 </div>
 </FadeUp>
 </div>
 </div>
 </div>
 </section>
 );
}
