'use client';

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Activity, 
  Target, 
  Zap, 
  ShieldCheck, 
  Settings2, 
  Cpu,
  ArrowRight,
  Sparkles,
  Search,
  Box,
  Terminal,
  Activity as PulseIcon
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const CATEGORY_CONFIG = {
  indicator: { 
    icon: Activity, 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-500/10', 
    border: 'border-indigo-500/20', 
    glow: 'shadow-indigo-500/20',
    label: 'Analytical Protocol'
  },
  condition: { 
    icon: Target, 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-500/10', 
    border: 'border-cyan-500/20', 
    glow: 'shadow-cyan-500/20',
    label: 'Logic Interceptor'
  },
  action: { 
    icon: Zap, 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10', 
    border: 'border-emerald-500/20', 
    glow: 'shadow-emerald-500/20',
    label: 'Execution Module'
  },
  risk: { 
    icon: ShieldCheck, 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10', 
    border: 'border-amber-500/20', 
    glow: 'shadow-amber-500/20',
    label: 'Capital Guard'
  },
} as const;

export const FlowNode = memo(({ data, selected }: any) => {
  const config = CATEGORY_CONFIG[data.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.indicator;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -5, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      className={cn(
        "rounded-[42px] transition-all duration-700 min-w-[360px] overflow-hidden group relative p-[2px]",
        selected 
          ? "bg-gradient-to-br from-p via-indigo-500 to-p shadow-[0_0_100px_rgba(99,102,241,0.4)] scale-[1.05] z-50" 
          : "bg-white/10 border-white/[0.05] shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
      )}
    >
      {/* Chassis Depth Layer */}
      <div className="absolute inset-[3px] rounded-[39px] bg-[#0a0a0f] z-0 overflow-hidden">
          <div className="absolute inset-0 bg-scanlines opacity-[0.05] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      </div>

      {/* Internal Content Container */}
      <div className="relative z-20 bg-black/40 backdrop-blur-3xl rounded-[39px] overflow-hidden">
          {/* Module Header Bar - Advanced Hardware Styling */}
          <div className="h-16 bg-white/[0.03] border-b border-white/[0.05] px-10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 h-full">
                      <div className={cn("w-2 h-2 rounded-full", config.color.replace('text', 'bg'), "shadow-[0_0_10px_currentColor]")} />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                      <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-p uppercase tracking-[0.6em] font-syne italic">{config.label}</span>
                     <span className="text-[7px] text-white/20 font-black uppercase tracking-[0.4em]">NEURAL_CHAIN_NODE_ACTIVE</span>
                  </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 shadow-inner">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest font-mono italic">UNIT_{Math.random().toString(16).slice(2, 6).toUpperCase()}</span>
                </div>
                <button className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-p/20 hover:text-p transition-all group/settings">
                    <Settings2 className="w-5 h-5 text-white/20 group-hover/settings:rotate-90 transition-transform duration-500" />
                </button>
              </div>
          </div>

          <div className="p-12 relative">
              {/* Connector Ports - Targeted Aesthetics */}
              <Handle 
                type="target" 
                position={Position.Left} 
                className="!w-8 !h-8 !-left-4 !bg-black !border-[3px] !border-p !shadow-[0_0_30px_rgba(99,102,241,0.6)] !opacity-100 transition-all duration-700 !rounded-full group-hover:scale-125 group-hover:!bg-p" 
              />
              
              <div className="flex items-center gap-10">
                <div className={cn(
                  "w-24 h-24 rounded-[32px] flex items-center justify-center border-2 transition-all duration-1000 relative group-hover:rotate-[15deg] group-hover:scale-110",
                  config.bg,
                  config.border,
                  config.glow,
                  "shadow-[inset_0_0_40px_rgba(255,255,255,0.05)]"
                )}>
                  {/* Industrial Hex Architecture */}
                  <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                  <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-white/30 rounded-tl-md" />
                  <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-white/30 rounded-br-md" />

                  <Icon className={cn("w-12 h-12", config.color, "drop-shadow-[0_0_15px_currentColor]")} />
                </div>
                
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-4">
                    <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic font-syne leading-none group-hover:text-p transition-colors duration-500">{data.label}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded-lg bg-p/10 border border-p/20 flex items-center gap-2">
                        <PulseIcon className="w-3 h-3 text-p animate-pulse" />
                        <span className="text-[9px] font-black text-p uppercase tracking-[0.2em]">Live_Sync</span>
                    </div>
                    <div className="w-px h-4 bg-white/10" />
                    <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] font-mono italic">HEX:{Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* High-Performance Telemetry Interface */}
              <div className="mt-12 space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-p" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 font-syne italic">Protocol Efficiency</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl font-jet-mono italic shadow-2xl", config.bg, config.color)}>98.42%</span>
                    </div>
                  </div>
                  
                  {/* Neural Activity Graph */}
                  <div className="h-16 p-4 rounded-[28px] bg-black/40 border border-white/5 flex items-end gap-2 overflow-hidden group-hover:border-p/40 transition-all duration-700 shadow-inner relative">
                     <div className="absolute inset-0 bg-scanlines opacity-[0.03]" />
                     {Array.from({ length: 28 }).map((_, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ height: "10%" }}
                            animate={{ height: `${20 + Math.random() * 80}%` }}
                            transition={{ delay: i * 0.02, duration: 0.6, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
                            className={cn(
                                "flex-1 rounded-full opacity-60", 
                                selected ? "bg-p shadow-[0_0_10px_#6366f1]" : "bg-white/20 group-hover:bg-white/40"
                            )}
                        />
                     ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col gap-3 group-hover:bg-white/[0.08] transition-all duration-700 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-p/5 blur-2xl rounded-full" />
                        <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-white/20" />
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] font-syne italic">Latent Matrix</span>
                        </div>
                        <span className="text-xl font-black text-white italic font-syne tracking-tighter">0.242ms</span>
                    </div>
                    <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col gap-3 group-hover:bg-white/[0.08] transition-all duration-700 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 blur-2xl rounded-full" />
                        <div className="flex items-center gap-3">
                            <Cpu className="w-4 h-4 text-white/20" />
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] font-syne italic">Logic Core</span>
                        </div>
                        <span className="text-xl font-black text-emerald-400 italic font-syne tracking-tighter uppercase">OPTIMIZED</span>
                    </div>
                  </div>
              </div>

              <Handle 
                type="source" 
                position={Position.Right} 
                className="!w-8 !h-8 !-right-4 !bg-black !border-[3px] !border-p !shadow-[0_0_30px_rgba(99,102,241,0.6)] !opacity-100 transition-all duration-700 !rounded-full group-hover:scale-125 group-hover:!bg-p" 
              />
          </div>

          {/* Secure Institutional Footer */}
          <div className="h-14 bg-white/[0.02] border-t border-white/[0.05] px-10 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-all duration-700">
             <div className="flex items-center gap-4">
                <ShieldCheck className="w-4 h-4 text-p" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] font-syne italic">Acceleration: NVX_NEURAL_STABLE</span>
             </div>
             <div className="flex items-center gap-4">
                <span className="text-[9px] font-black text-white/10 uppercase font-mono tracking-widest">VER_NODE.22</span>
                <div className="w-8 h-px bg-white/10 group-hover:w-12 group-hover:bg-p transition-all duration-700" />
             </div>
          </div>
      </div>
    </motion.div>
  );
});

FlowNode.displayName = 'FlowNode';
