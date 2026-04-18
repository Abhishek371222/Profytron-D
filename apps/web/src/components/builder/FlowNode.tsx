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

import { NodeProps } from 'reactflow';
import { NodeData } from '@/lib/stores/useBuilderStore';

export const FlowNode = memo(({ data, selected, id }: NodeProps<NodeData>) => {
  const config = CATEGORY_CONFIG[data.category] || CATEGORY_CONFIG.indicator;
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ y: -3, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      className={cn(
        "rounded-[26px] transition-all duration-700 min-w-[270px] overflow-hidden group relative p-[1px]",
        selected 
          ? "bg-linear-to-br from-primary via-indigo-500 to-cyan-400 shadow-[0_0_120px_rgba(99,102,241,0.3)] scale-[1.02] z-50" 
          : "bg-white/10 border-white/3 shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
      )}
    >
      {/* Chassis Depth Layer */}
      <div className="absolute inset-[2px] rounded-[25px] bg-[#050508] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0 bg-linear-to-br from-white/3 via-transparent to-transparent pointer-events-none" />
        {/* Internal Glow for hardware feel */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Internal Content Container */}
      <div className="relative z-20 bg-black/20 backdrop-blur-3xl rounded-[25px] overflow-hidden">
        {/* Module Header Bar - Hardware Terminal Style */}
        <div className="h-12 bg-white/2 border-b border-white/5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", config.color.replace('text', 'bg'), "shadow-[0_0_10px_currentColor]")} />
              <div className="w-1.5 h-1.5 rounded-full bg-white/5 animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/5 animate-pulse delay-150" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">{config.label}</span>
              <span className="text-[8px] text-white/20 font-bold uppercase tracking-[0.1em] mt-0.5 font-mono">NODE_SYS_ID: {id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 shadow-inner">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.08em] font-mono">NVX-MOD.{id.slice(-4).toUpperCase()}</span>
            </div>
            <button className="w-7 h-7 rounded-lg bg-white/3 border border-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all group/settings group-hover:border-primary/20">
              <Settings2 className="w-3.5 h-3.5 text-white/20 group-hover/settings:rotate-90 transition-transform duration-700" />
            </button>
          </div>
        </div>

        <div className="p-5 relative">
          {/* Connector Ports */}
          <Handle 
            type="target" 
            position={Position.Left} 
            className="!w-6 !h-6 !-left-3 !bg-black !border-2 !border-primary !shadow-[0_0_20px_rgba(99,102,241,0.8)] !opacity-100 transition-all duration-700 !rounded-lg group-hover:scale-110" 
          />
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center border transition-all duration-700 relative group-hover:rotate-[10deg] group-hover:scale-105",
              config.bg,
              config.border,
              config.glow,
              "shadow-[inset_0_0_25px_rgba(255,255,255,0.05)]"
            )}>
              <div className="absolute inset-2 border border-white/5 rounded-lg" />
              <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-white/30 rounded-tl" />
              <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-white/30 rounded-br" />
              <Icon className={cn("w-7 h-7", config.color, "drop-shadow-[0_0_12px_currentColor]")} />
            </div>
            
            <div className="flex flex-col space-y-2">
              <h4 className="text-lg font-semibold text-white uppercase tracking-tight leading-none group-hover:text-primary transition-colors duration-500">{data.label}</h4>
              <div className="flex items-center gap-2.5">
                <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-[0.08em]">Active_State</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <span className="text-[8px] text-white/20 font-bold uppercase tracking-[0.12em] font-mono">PROTOCOL_STABLE</span>
              </div>
            </div>
          </div>

          {/* Telemetry HUD Area */}
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/30">Protocol Execution Flow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-linear-to-r from-transparent via-white/10 to-transparent" />
                <span className={cn("text-[8px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-md font-jet-mono shadow-2xl bg-black/40 border border-white/5", config.color)}>98.42%_READY</span>
              </div>
            </div>
            
            {/* Neural Lattice Visualization */}
            <div className="h-14 p-2.5 rounded-xl bg-black/60 border border-white/5 flex items-end gap-1.5 overflow-hidden group-hover:border-primary/30 transition-all duration-700 relative">
              <div className="absolute inset-0 bg-scanlines opacity-[0.05]" />
              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-primary/30 to-transparent animate-scanline" />
              {Array.from({ length: 32 }).map((_, i) => {
                const h = 20 + ((i * 17) % 75);
                return (
                  <motion.div 
                    key={i} 
                    initial={{ height: "10%" }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: i * 0.02, duration: 0.8, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
                    className={cn(
                      "flex-1 rounded-full transition-all duration-500", 
                      selected ? "bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-white/10 opacity-40 group-hover:bg-white/20"
                    )}
                  />
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/1 border border-white/5 flex flex-col gap-2 group-hover:bg-white/3 group-hover:border-white/10 transition-all duration-1000 relative overflow-hidden group/subcard">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 blur-3xl rounded-full transition-all group-hover/subcard:bg-primary/10" />
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-white/10" />
                  <span className="text-[8px] font-bold text-white/25 uppercase tracking-[0.12em]">Neural Latency</span>
                </div>
                <div className="flex items-end gap-1.5">
                  <span className="text-lg font-semibold text-white tracking-tighter">0.242</span>
                  <span className="text-[10px] font-bold text-white/20 mb-0.5 uppercase font-mono">ms</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/1 border border-white/5 flex flex-col gap-2 group-hover:bg-white/3 group-hover:border-white/10 transition-all duration-1000 relative overflow-hidden group/subcard">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-3xl rounded-full transition-all group-hover/subcard:bg-emerald-500/10" />
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-white/10" />
                  <span className="text-[8px] font-bold text-white/25 uppercase tracking-[0.12em]">Fabrication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                  <span className="text-sm font-semibold text-emerald-400 tracking-tight uppercase">OPTIMIZED</span>
                </div>
              </div>
            </div>
          </div>

          <Handle 
            type="source" 
            position={Position.Right} 
            className="!w-6 !h-6 !-right-3 !bg-black !border-2 !border-primary !shadow-[0_0_20px_rgba(99,102,241,0.8)] !opacity-100 transition-all duration-700 !rounded-lg group-hover:scale-110" 
          />
        </div>

        {/* Secure Institutional Footer */}
        <div className="h-10 bg-white/2 border-t border-white/5 px-5 flex items-center justify-between opacity-35 group-hover:opacity-100 transition-all duration-1000">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.12em] font-mono">SECURE_HW_LINK: ACTIVE_TLS_1.3</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-bold text-white/20 uppercase font-mono tracking-[0.12em]">CORE_v4.28</span>
            <div className="w-8 h-px bg-white/10 group-hover:w-12 group-hover:bg-primary transition-all duration-1000" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

FlowNode.displayName = 'FlowNode';
