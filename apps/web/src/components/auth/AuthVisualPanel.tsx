'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FloatingCards } from './FloatingCards';
import { ShieldCheck, Lock, Users, Zap, Globe, Sparkles } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AuthVisualPanelProps {
 tagline?: string;
 type?: 'login' | 'register';
}

export const AuthVisualPanel = ({ 
  tagline = "Trade Smarter. Automate Everything.", 
  type = 'login' 
}: AuthVisualPanelProps) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles([...Array(20)].map((_, i) => ({
      id: i,
      initialY: Math.random() * 1000,
      randomX: (Math.random() - 0.5) * 50,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 10,
      left: `${Math.random() * 100}%`
    })));
  }, []);

  return (
    <div className="relative h-full w-full bg-bg-card overflow-hidden hidden lg:flex flex-col border-r border-border-default">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.1),transparent_70%)]" />
        
        {/* Large Atmospheric Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 100, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-150 h-150 bg-p/20 blur-[120px] rounded-full" 
        />
        
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
            y: [0, -100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-48 -right-48 w-200 h-200 bg-s/10 blur-[150px] rounded-full" 
        />

        {/* Floating Particle Simulation (CSS) */}
        <div className="absolute inset-0 opacity-20">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: p.initialY }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [null, -100],
                x: [null, p.randomX]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "linear"
              }}
              className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
              style={{ left: p.left }}
            />
          ))}
        </div>
      </div>

 {/* Content Layer */}
 <div className="relative z-10 flex-1 flex flex-col p-16">
 {/* Branding */}
 <motion.div 
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.8, ease:"easeOut" }}
 className="flex items-center gap-4"
 >
 <div className="relative group">
 <div className="absolute inset-0 bg-p blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
 <div className="relative w-12 h-12 rounded-2xl bg-linear-to-br from-p to-p-dark flex items-center justify-center border border-white/10 shadow-2xl">
 <Zap className="w-7 h-7 text-white fill-white animate-pulse" />
 </div>
 </div>
 <div>
 <h1 className="text-3xl font-display font-semibold tracking-tight text-white">
 PROFY<span className="text-p">TRON</span>
 </h1>
 <div className="h-0.5 w-8 bg-p mt-1 rounded-full" />
 </div>
 </motion.div>

 {/* Hero Visual Section */}
 <div className="flex-1 flex flex-col justify-center relative">
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 1, delay: 0.2 }}
 className="relative"
 >
 {/* Neural Core Effect */}
 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-p/5 rounded-full blur-[100px]" />
 <FloatingCards type={type === 'register' ? 'achievements' : 'strategies'} />
 
 <div className="mt-12 space-y-4 text-center lg:text-left">
 <h2 className="text-4xl font-display font-bold text-white leading-tight">
 {type === 'login' ? (
 <>Institutional Intelligence <br /> <span className="text-p font-accent font-normal">at your fingertips.</span></>
 ) : (
 <>The Future of Trading <br /> <span className="text-s font-accent font-normal">starts with you.</span></>
 )}
 </h2>
 <p className="text-slate-400 font-body text-lg max-w-md leading-relaxed">
 Connect your exchange, deploy high-frequency strategies, and monitor your global impact in real-time.
 </p>
 </div>
 </motion.div>
 </div>

 {/* Footer Trust Section */}
 <div className="mt-auto space-y-10 group">
 <div className="flex items-center gap-10 py-8 border-y border-white/5">
 <TrustItem icon={ShieldCheck} label="Military Grade SSL" />
 <TrustItem icon={Lock} label="End-to-End Encryption" />
 <TrustItem icon={Globe} label="Global Grid" />
 </div>

 <div className="flex items-center gap-6">
 <div className="flex -space-x-3">
 {[1, 2, 3, 4, 5].map((i) => (
 <div 
 key={i} 
 className="w-10 h-10 rounded-full border-2 border-bg-card bg-bg-elevated flex items-center justify-center text-xs font-semibold shadow-2xl relative overflow-hidden group/avatar"
 >
 <div className="absolute inset-0 bg-linear-to-br from-p/20 to-s/20 group-hover/avatar:opacity-0 transition-opacity" />
 <span className="relative z-10 text-white opacity-60">TR</span>
 <div className={`absolute inset-0 bg-linear-to-tr ${i % 2 === 0 ? 'from-p to-purple' : 'from-s to-p'} opacity-40`} />
 </div>
 ))}
 <div className="w-10 h-10 rounded-full border-2 border-bg-card bg-p flex items-center justify-center text-xs font-semibold text-white shadow-2xl">
 +12k
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-sm text-slate-200 font-bold flex items-center gap-2">
 Trusted by Institutional Traders <Sparkles className="w-3 h-3 text-p" />
 </p>
 <p className="text-xs text-slate-500">Join a global network of algorithmic edge seekers.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

const TrustItem = ({ icon: Icon, label }: { icon: LucideIcon; label: string }) => (
 <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 hover:text-p transition-colors cursor-default">
 <Icon className="w-4 h-4" />
 {label}
 </div>
);
