'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Zap, Shield, Sparkles, Cpu } from 'lucide-react';
import { FadeUp } from '@/components/animations';
import { Magnetic } from '@/components/ui/Interactions';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Lazy-load Three.js Globe — defers ~600KB of Three.js until AFTER hero text paints
const ThreeGlobe = dynamic(
 () => import('./ThreeGlobe').then((m) => ({ default: m.ThreeGlobe })),
 {
 ssr: false,
 loading: () => <div className="w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-primary/5 animate-pulse" />,
 }
);

export function HeroSection() {
 const containerRef = useRef<HTMLDivElement>(null);
 const { scrollY } = useScroll();
 const y1 = useTransform(scrollY, [0, 500], [0, 200]);

 // Mouse Interaction for parallax
 const mouseX = useMotionValue(0);
 const mouseY = useMotionValue(0);
 const springConfig = { damping: 25, stiffness: 150 };
 const springX = useSpring(mouseX, springConfig);
 const springY = useSpring(mouseY, springConfig);

 const handleMouseMove = (e: React.MouseEvent) => {
 const { clientX, clientY } = e;
 const { innerWidth, innerHeight } = window;
 mouseX.set((clientX / innerWidth - 0.5) * 60);
 mouseY.set((clientY / innerHeight - 0.5) * 60);
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
 style={{ x: springX, y: springY }}
 className="absolute top-[5%] left-[5%] w-[900px] h-[900px] bg-p/15 rounded-full blur-[220px] opacity-35 animate-pulse-slow" 
 />
 <motion.div 
 style={{ 
 x: useTransform(springX, v => v * -1.5), 
 y: useTransform(springY, v => v * -1.5)
 }}
 className="absolute bottom-[10%] right-[5%] w-[700px] h-[700px] bg-indigo-500/12 rounded-full blur-[200px] opacity-30" 
 />
 <motion.div 
 style={{ x: springX, y: useTransform(springY, v => v * 0.8) }}
 className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[150px] opacity-20"
 />
 
 {/* Holographic Layering */}
 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
 <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-[1]" />
 
 {/* Scanlines */}
 <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/[0.03] to-transparent h-[200%] pointer-events-none z-[2]" />
 </div>

 <div className="container mx-auto px-6 relative z-10">
 <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-16 lg:gap-24 items-center">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ duration: 0.6 }}
 className="text-left space-y-14"
 >
 {/* Badge */}
 <FadeUp delay={0.05}>
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-p/10 border border-p/30 text-p text-[11px] font-bold uppercase tracking-[0.6em] relative group overflow-hidden shadow-[0_20px_40px_rgba(99,102,241,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>v5.0_IntelliCore_Ready</span>
          </div>
        </FadeUp>
 
 {/* Main Headline */}
 <FadeUp delay={0.1}>
 <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              className="text-7xl sm:text-8xl md:text-9xl lg:text-[130px] font-bold leading-[0.95] tracking-[-0.04em] uppercase bg-clip-text bg-gradient-to-b from-white via-white to-white/20 text-transparent"
            >
              Trading <br />
              <span className="bg-gradient-to-r from-p via-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                At The Edge
              </span>
            </motion.h1>
 
 <FadeUp delay={0.2}>
 <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl font-medium tracking-tight">
 Institutional-Grade Algorithmic Trading Powered by Neural Networks. 
 Deploy sophisticated strategies with institutional-grade infrastructure and real-time market intelligence.
 </p>
 </FadeUp>
 </div>
 </FadeUp>

 {/* CTA Buttons */}
 <FadeUp delay={0.3}>
 <div className="flex flex-col sm:flex-row items-start gap-6 pt-8">
 <Magnetic strength={0.35}>
 <Link href="/register">
 <motion.div
 whileHover={{ scale: 1.02, y: -4 }}
 whileTap={{ scale: 0.98 }}
 >
 <Button 
 size="lg" 
 className="h-16 px-10 text-lg bg-gradient-to-r from-p to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 rounded-2xl group shadow-[0_20px_60px_rgba(99,102,241,0.4)] transition-all duration-700 font-bold tracking-[0.05em] uppercase relative overflow-hidden border-0"
 >
 <span className="relative z-10 flex items-center gap-3">
 LaunchPlatform
 <motion.div
 animate={{ x: [0, 8, 0] }}
 transition={{ duration: 2, repeat: Infinity }}
 >
 <ArrowRight className="w-5 h-5" />
 </motion.div>
 </span>
 <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
 </Button>
 </motion.div>
 </Link>
 </Magnetic>

 <Magnetic strength={0.2}>
 <Link href="/dashboard">
 <motion.div
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.98 }}
 >
 <Button 
 variant="ghost" 
 size="lg"
 className="h-16 px-10 text-lg border-2 border-white/20 bg-white/[0.05] hover:bg-white/[0.1] rounded-2xl font-bold tracking-[0.05em] uppercase text-white/70 hover:text-white transition-all duration-500 shadow-inner"
 >
 <Play className="mr-3 w-5 h-5 fill-current" />
 Test Drive
 </Button>
 </motion.div>
 </Link>
 </Magnetic>
 </div>
 </FadeUp>

 {/* Stats Row */}
 <FadeUp delay={0.5}>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 pt-12 border-t-2 border-white/5">
 {[
 { label: 'Security Level', icon: Shield, val: 'MIL-GRADE', color: 'text-emerald-400' },
 { label: 'Latency', icon: Zap, val: '<42ms', color: 'text-p' },
 { label: 'Uptime', icon: Cpu, val: '99.99%', color: 'text-cyan-400' }
 ].map((stat, i) => (
 <motion.div 
 key={i} 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.5 + (i * 0.1) }}
 className="flex flex-col gap-2 group"
 >
 <div className="flex items-center gap-2 text-xs uppercase font-semibold tracking-[0.3em] text-white/50 group-hover:text-white transition-colors">
 <stat.icon className="w-4 h-4" />
 {stat.label}
 </div>
 <span className={`text-2xl sm:text-3xl font-mono font-bold ${stat.color} drop-shadow-[0_0_10px_currentColor]`}>{stat.val}</span>
 </motion.div>
 ))}
 </div>
 </FadeUp>
 </motion.div>

 {/* Right Column - Globe with Enhanced Effects */}
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.8, delay: 0.2 }}
 className="relative h-[500px] lg:h-[650px] items-center justify-center hidden lg:flex"
 >
 {/* Animated Background Elements */}
 <motion.div 
 style={{ 
 y: y1, 
 rotateX: useTransform(springY, v => v * -0.05),
 rotateY: useTransform(springX, v => v * 0.05)
 }}
 className="relative w-full h-full flex items-center justify-center perspective-container"
 >
 {/* Holographic Rings */}
 <motion.div 
 animate={{ rotate: 360 }}
 transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
 className="absolute inset-0 max-w-full max-h-full flex items-center justify-center"
 >
 <div className="absolute w-60 h-60 border-2 border-p/20 rounded-full" />
 </motion.div>

 <motion.div 
 animate={{ rotate: -360 }}
 transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
 className="absolute inset-0 max-w-full max-h-full flex items-center justify-center"
 >
 <div className="absolute w-40 h-40 border-2 border-indigo-500/20 rounded-full" />
 </motion.div>

 {/* Center Glow */}
 <motion.div 
 animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
 transition={{ duration: 4, repeat: Infinity }}
 className="absolute inset-0 max-w-full max-h-full flex items-center justify-center"
 >
 <div className="w-96 h-96 bg-gradient-to-br from-p/30 to-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
 </motion.div>

 {/* Floating Orbital Dots */}
 {[0, 120, 240].map((angle, i) => (
 <motion.div
 key={i}
 animate={{ rotate: 360 }}
 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
 className="absolute inset-0 max-w-full max-h-full flex items-center justify-center"
 style={{ transform: `rotate(${angle}deg)` }}
 >
 <motion.div 
 className="absolute w-48 h-0 flex items-start justify-start"
 style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
 >
 <motion.div 
 animate={{ scale: [1, 1.2, 1] }}
 transition={{ delay: i * 0.3, duration: 3, repeat: Infinity }}
 className="w-3 h-3 rounded-full bg-p shadow-[0_0_15px_#6366f1]"
 />
 </motion.div>
 </motion.div>
 ))}

 {/* Globe */}
 <div className="relative z-10 drop-shadow-[0_0_60px_rgba(99,102,241,0.35)]">
 <ThreeGlobe />
 </div>
 </motion.div>

 {/* Data Stream Lines */}
 <motion.div 
 animate={{ opacity: [0.3, 0.6, 0.3] }}
 transition={{ duration: 3, repeat: Infinity }}
 className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.05] border-2 border-p/30 backdrop-blur-sm"
 >
 <div className="w-2 h-2 rounded-full bg-p animate-pulse" />
 <span className="text-xs text-white/60 font-mono uppercase tracking-wider">STREAMING LIVE MARKET DATA</span>
 </motion.div>
 </motion.div>
 </div>
 </div>

 {/* Bottom Scroll Indicator */}
 <motion.div 
 animate={{ y: [0, 12, 0], opacity: [0.2, 0.6, 0.2] }}
 transition={{ duration: 3.5, repeat: Infinity }}
 className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 group z-20"
 >
 <span className="text-xs uppercase tracking-[0.5em] font-semibold text-white/40 group-hover:text-white transition-colors">EXPLORE</span>
 <motion.div className="w-[2px] h-8 bg-gradient-to-b from-p via-p/40 to-transparent">
 <motion.div 
 animate={{ y: [0, 8, 0] }}
 transition={{ duration: 1.5, repeat: Infinity }}
 className="w-1.5 h-1.5 rounded-full bg-p shadow-[0_0_10px_#6366f1] mx-auto mt-1"
 />
 </motion.div>
 </motion.div>
 </section>
 );
}
