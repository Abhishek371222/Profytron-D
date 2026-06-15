'use client';

import { motion } from 'framer-motion';
import { FloatingCards } from './FloatingCards';
import { Zap, Sparkles } from 'lucide-react';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { TrustBadges } from '@/components/trust/TrustBadges';

interface AuthVisualPanelProps {
 tagline?: string;
 type?: 'login' | 'register';
}

export const AuthVisualPanel = ({ 
  tagline = "Trade Smarter. Automate Everything.", 
  type = 'login' 
}: AuthVisualPanelProps) => {
  return (
    <div className="relative h-full w-full bg-bg-secondary overflow-hidden hidden lg:flex flex-col border-r border-border">
      {/* Ambient background */}
      <AmbientBackground variant="auth" position="absolute" />

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
 <div className="absolute inset-0 bg-primary blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
 <div className="relative w-12 h-12 rounded-2xl bg-linear-to-br from-primary to-primary-dark flex items-center justify-center border border-border shadow-2xl">
 <Zap className="w-7 h-7 text-foreground fill-white animate-pulse" />
 </div>
 </div>
 <div>
 <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
 PROFY<span className="text-primary">TRON</span>
 </h1>
 <div className="h-0.5 w-8 bg-primary mt-1 rounded-full" />
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
 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
 <FloatingCards type={type === 'register' ? 'achievements' : 'strategies'} />
 
 <div className="mt-12 space-y-4 text-center lg:text-left">
 <h2 className="text-4xl font-serif font-bold text-foreground leading-tight">
 {type === 'login' ? (
 <>Your Intelligence <br /> <span className="text-primary font-accent font-normal">at your fingertips.</span></>
 ) : (
 <>The Future of Trading <br /> <span className="text-s font-accent font-normal">starts with you.</span></>
 )}
 </h2>
 <p className="text-muted-foreground font-sans text-lg max-w-md leading-relaxed">
 Connect your exchange, deploy high-frequency strategies, and monitor your global impact in real-time.
 </p>
 </div>
 </motion.div>
 </div>

 {/* Footer Trust Section */}
 <div className="mt-auto pt-8 border-t border-border">
 <TrustBadges compact className="mb-6" />
 <div className="flex items-center gap-6">
 <div className="flex -space-x-3">
 {[1, 2, 3, 4, 5].map((i) => (
 <div 
 key={i} 
 className="w-10 h-10 rounded-full border-2 border-bg-card bg-bg-elevated flex items-center justify-center text-xs font-semibold shadow-2xl relative overflow-hidden group/avatar"
 >
 <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-s/20 group-hover/avatar:opacity-0 transition-opacity" />
 <span className="relative z-10 text-foreground opacity-60">TR</span>
 <div className={`absolute inset-0 bg-linear-to-tr ${i % 2 === 0 ? 'from-primary to-purple' : 'from-s to-primary'} opacity-40`} />
 </div>
 ))}
 <div className="w-10 h-10 rounded-full border-2 border-bg-card bg-primary flex items-center justify-center text-xs font-semibold text-foreground shadow-2xl">
 +12k
 </div>
 </div>
 <div className="space-y-1">
 <p className="text-sm text-foreground/80 font-bold flex items-center gap-2">
 Trusted by Your Traders <Sparkles className="w-3 h-3 text-primary" />
 </p>
 <p className="text-xs text-muted-foreground">Join a global network of algorithmic edge seekers.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
