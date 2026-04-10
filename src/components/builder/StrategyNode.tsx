'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
// BUILD_SALT_RESET_V3: 0xCF91_STABLE_RECOVERY_STRATEGY_NODE
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Zap, 
  Settings2, 
  Activity, 
  ShieldCheck, 
  ArrowRightLeft,
  Target,
  BarChart3,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NodeData } from '@/lib/stores/useBuilderStore';

const CATEGORY_MAP = {
  indicator: {
    color: '#6366f1',
    label: 'Indicator',
    icon: Activity,
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
    border: 'border-indigo-500/30'
  },
  condition: {
    color: '#06b6d4',
    label: 'Logic',
    icon: Settings2,
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    border: 'border-cyan-500/30'
  },
  action: {
    color: '#10b981',
    label: 'Action',
    icon: Target,
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    border: 'border-emerald-500/30'
  },
  risk: {
    color: '#f59e0b',
    label: 'Risk',
    icon: ShieldCheck,
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    border: 'border-amber-500/30'
  }
};

export const StrategyNode = memo(({ data, selected }: NodeProps<NodeData>) => {
  const meta = CATEGORY_MAP[data.category as keyof typeof CATEGORY_MAP] || CATEGORY_MAP.indicator;
  const Icon = meta.icon;

  return (
    <div className={cn(
      "w-[240px] bg-[#11111a]/80 backdrop-blur-3xl border rounded-[24px] overflow-hidden transition-all duration-500 select-none",
      selected 
        ? "ring-[3px] ring-p shadow-[0_0_40px_rgba(99,102,241,0.3)] border-p/50" 
        : cn("border-white/[0.08]", meta.glow, meta.border)
    )}>
      {/* Visual Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" style={{ color: meta.color }} />

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <Icon className="w-4 h-4" style={{ color: meta.color }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{meta.label}</span>
            <span className="text-xs font-bold text-white tracking-tight">{data.label}</span>
          </div>
        </div>
        {selected && (
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-2 h-2 rounded-full bg-p shadow-[0_0_10px_#6366f1]" 
            />
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {Object.entries(data.params).length > 0 ? (
          <div className="space-y-2.5">
            {Object.entries(data.params).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between group/item">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{key}</span>
                <div className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5 group-hover/item:border-white/20 transition-colors">
                    <span className="text-[10px] font-black text-p font-mono">
                        {typeof value === 'boolean' ? (value ? 'YES' : 'NO') : value}
                    </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 opacity-20 gap-2">
             <Waves className="w-6 h-6 animate-pulse" />
             <span className="text-[9px] font-bold uppercase tracking-widest italic text-center leading-none">Awaiting Logic Data</span>
          </div>
        )}
      </div>

      {/* Footer / Meta */}
      <div className="px-5 py-2.5 bg-black/40 border-t border-white/[0.05] flex items-center justify-between">
         <div className="flex items-center gap-1.5 opacity-40">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <span className="text-[8px] font-bold text-white uppercase tracking-widest">Active</span>
         </div>
         <BarChart3 className="w-3 h-3 text-white/10" />
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !-left-2 !border-4 !border-[#0d0d12] !bg-indigo-500 !shadow-[0_0_10px_rgba(99,102,241,0.5)] hover:!scale-125 transition-transform cursor-crosshair"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !-right-2 !border-4 !border-[#0d0d12] !bg-emerald-500 !shadow-[0_0_10px_rgba(16,185,129,0.5)] hover:!scale-125 transition-transform cursor-crosshair"
      />
    </div>
  );
});

StrategyNode.displayName = 'StrategyNode';
