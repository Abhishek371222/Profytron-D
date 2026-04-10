'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Zap, Shield, Sparkles } from 'lucide-react';
import { FadeUp } from '@/components/animations';
import { Magnetic } from '@/components/ui/Interactions';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Lazy-load Three.js Globe — defers ~600KB of Three.js until AFTER hero text paints
const ThreeGlobe = dynamic(
  () => import('./ThreeGlobe').then((m) => ({ default: m.ThreeGlobe })),
  {
    ssr: false,
    loading: () => <div className="w-[400px] h-[400px] rounded-full bg-primary/5 animate-pulse" />,
  }
);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Mouse Interaction for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth - 0.5) * 40);
    mouseY.set((clientY / innerHeight - 0.5) * 40);
  };

  return (
    <section 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex items-center pt-32 pb-12 overflow-hidden bg-black"
    >
      {/* Cinematic Background Architecture */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dynamic Glows */}
        <motion.div 
          style={{ x: mouseX, y: mouseY }}
          className="absolute top-[10%] left-[10%] w-[800px] h-[800px] bg-p/10 rounded-full blur-[200px] opacity-40 animate-pulse-slow" 
        />
        <motion.div 
          style={{ x: useTransform(mouseX, v => v * -1.2), y: useTransform(mouseY, v => v * -1.2) }}
          className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[180px] opacity-30" 
        />
        
        {/* Holographic Layering */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-[1]" />
        
        {/* Scanlines */}
        <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/[0.03] to-transparent h-[200%] pointer-events-none z-[2]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-20 items-center">
          <div className="text-left space-y-12">
            <FadeUp delay={0.05}>
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-2xl glass-ultra border-white/10 text-p text-[11px] font-black uppercase tracking-[0.4em] relative group overflow-hidden shadow-2xl">
                 <div className="absolute inset-0 bg-p/10 animate-pulse opacity-50" />
                 <Sparkles className="w-3.5 h-3.5 relative z-10" />
                 <span className="relative z-10 font-syne">v4.0 Neural Core: Synchronized</span>
                 <div className="absolute h-full w-px bg-p/40 right-0 animate-scanline" />
              </div>
            </FadeUp>
            
            <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                className="text-7xl md:text-9xl lg:text-[140px] font-syne font-black leading-[0.85] tracking-[-0.05em] uppercase italic"
              >
                Tradi<span className="text-white/10 outline-text">ng</span> <br />
                At The <span className="text-p drop-shadow-[0_0_30px_#6366f1] animate-glow">Edge.</span>
              </motion.h1>
              
              <FadeUp delay={0.2}>
                <p className="text-xl md:text-2xl text-white/40 leading-relaxed max-w-xl font-syne font-medium italic tracking-tight">
                  Institutional Algorithmic Fabrication via Neural Networks. 
                  Deploy Alpha with the world&apos;s most advanced hardware-accelerated stack.
                </p>
              </FadeUp>
            </div>

            <FadeUp delay={0.3}>
              <div className="flex flex-wrap items-center gap-8">
                <Magnetic strength={0.3}>
                  <Link href="/register">
                    <Button size="lg" className="h-20 px-12 text-xl bg-p hover:bg-indigo-500 rounded-[28px] group shadow-[0_20px_50px_rgba(99,102,241,0.5)] transition-all duration-700 font-syne font-black tracking-[0.1em] uppercase italic relative overflow-hidden">
                      <span className="relative z-10 flex items-center gap-3">
                         Launch Module
                         <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
                      </span>
                      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    </Button>
                  </Link>
                </Magnetic>
                <Magnetic strength={0.2}>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="h-20 px-12 text-xl border-2 border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[28px] font-syne font-black tracking-[0.1em] uppercase text-white/50 hover:text-white transition-all shadow-inner italic">
                      <Play className="mr-3 w-6 h-6 fill-current" />
                      View Sandbox
                    </Button>
                  </Link>
                </Magnetic>
              </div>
            </FadeUp>
            
            <FadeUp delay={0.5}>
              <div className="flex items-center gap-16 text-white/20 pt-10 border-t border-white/5">
                {[
                  { label: 'MILITARY SHIELD', icon: Shield, val: 'AES-256' },
                  { label: 'NODE LATENCY', icon: Zap, val: '42ms_PULSE' },
                  { label: 'DATA EPOCH', icon: Sparkles, val: 'REAL-TIME' }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col gap-2 group cursor-default">
                    <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-[0.4em] group-hover:text-p transition-colors font-syne">
                      <stat.icon className="w-4 h-4" />
                      {stat.label}
                    </div>
                    <span className="text-[12px] font-jet-mono text-white/50 group-hover:text-white transition-colors">{stat.val}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          <div className="relative h-[700px] w-full flex items-center justify-center">
            <motion.div 
              style={{ 
                y: y1, 
                opacity,
                rotateX: useTransform(mouseY, v => v * -0.04),
                rotateY: useTransform(mouseX, v => v * 0.04)
              }}
              className="relative w-full h-full flex items-center justify-center perspective-container scale-110"
            >
              {/* Holo Ring Effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-p/10 rounded-full animate-spin-ultra opacity-20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-indigo-500/10 rounded-full animate-reverse-spin opacity-10" />
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-p/20 blur-[180px] rounded-full pointer-events-none z-0 animate-pulse" />
              
              <div className="relative z-10 w-full h-full flex items-center justify-center scale-110 lg:scale-150 drop-shadow-[0_0_80px_rgba(99,102,241,0.3)]">
                <ThreeGlobe />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Industrial Scroll Guide */}
      <motion.div 
        animate={{ y: [0, 15, 0], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 group"
      >
        <div className="px-3 py-1 rounded-full border border-white/5 bg-white/5">
           <span className="text-[9px] uppercase tracking-[0.6em] font-black text-white/40 group-hover:text-white transition-colors font-syne">TERMINAL_LINK</span>
        </div>
        <div className="w-px h-16 bg-gradient-to-b from-p via-p/40 to-transparent relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-p shadow-[0_0_10px_#6366f1]" />
        </div>
      </motion.div>
    </section>
  );
}
