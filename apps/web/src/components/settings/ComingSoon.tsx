'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Cpu, Zap } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface ComingSoonProps {
 title?: string;
 description?: string;
 className?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
 title ="Module Intercepted", 
 description ="System under development by Quant Core Team",
 className
}) => (
 <div className={cn("h-[500px] flex flex-col items-center justify-center space-y-10 text-center relative overflow-hidden", className)}>
 {/* Background Ambiance */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
 
 <div className="relative group">
 <div className="absolute -inset-6 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse-slow" />
 <div className="w-24 h-24 rounded-4xl glass-ultra flex items-center justify-center border border-primary/20 relative overflow-hidden group">
 <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-primary/10 to-transparent h-[200%] pointer-events-none" />
 <Sparkles className="w-10 h-10 text-primary animate-hologram" />
 
 {/* Corner brackets */}
 <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-primary/40" />
 <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-primary/40" />
 <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-primary/40" />
 <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-primary/40" />
 </div>
 </div>

 <div className="space-y-4 relative z-10">
 <div className="flex items-center justify-center gap-3">
 <Cpu className="w-3.5 h-3.5 text-white/20" />
 <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.5em]">System Access Restricted</span>
 </div>
 <h2 className="text-4xl font-semibold text-white uppercase tracking-tight drop-shadow-2xl">{title}</h2>
 <p className="text-sm text-white/40 font-semibold uppercase tracking-[0.2em]">{description}</p>
 </div>

 <div className="pt-8 space-y-6">
 <div className="w-64 h-1.5 bg-white/3 rounded-full border border-white/5 p-0.5 overflow-hidden">
 <motion.div 
 initial={{ x:"-100%" }}
 animate={{ x:"100%" }}
 transition={{ repeat: Infinity, duration: 2.5, ease:"linear" }}
 className="w-1/2 h-full bg-primary shadow-[0_0_20px_rgba(99,102,241,0.8)] rounded-full"
 />
 </div>
 <div className="flex items-center justify-center gap-8">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">Compiling Assets</span>
 </div>
 <div className="flex items-center gap-2">
 <Zap className="w-3 h-3 text-amber-500" />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest">L2 Finalizing</span>
 </div>
 </div>
 </div>
 </div>
);

export default ComingSoon;
