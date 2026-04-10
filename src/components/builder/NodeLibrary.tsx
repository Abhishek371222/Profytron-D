'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Target, 
  Zap, 
  ShieldCheck, 
  Search,
  Box,
  Cpu,
  ArrowRight,
  ChevronRight,
  Filter
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const NODE_TYPES = [
  {
    id: 'indicators',
    label: 'Signal Intelligence',
    icon: Activity,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    items: [
      { id: 'rsi', label: 'RSI Oscillator', category: 'indicator', desc: 'Momentum differential protocol' },
      { id: 'macd', label: 'MACD Divergence', category: 'indicator', desc: 'Trend acceleration vector' },
      { id: 'ema', label: 'EMA Crossover', category: 'indicator', desc: 'Neural wave filtering' },
      { id: 'vol', label: 'Volume Flow', category: 'indicator', desc: 'Liquidity density monitor' },
    ]
  },
  {
    id: 'logic',
    label: 'Decision Nodes',
    icon: Target,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    items: [
      { id: 'if', label: 'Logic Interceptor', category: 'condition', desc: 'Boolean state validation' },
      { id: 'and', label: 'Conjunction Bus', category: 'condition', desc: 'Multi-vector synchronization' },
      { id: 'wait', label: 'Temporal Delay', category: 'condition', desc: 'Synchronous execution pause' },
    ]
  },
  {
    id: 'execution',
    label: 'Execution Units',
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    items: [
      { id: 'buy', label: 'Market Ingress', category: 'action', desc: 'Aggressive capital deployment' },
      { id: 'sell', label: 'Market Egress', category: 'action', desc: 'Liquidity extraction protocol' },
      { id: 'limit', label: 'Target Order', category: 'action', desc: 'Precision range entry' },
    ]
  },
  {
    id: 'safety',
    label: 'Security Core',
    icon: ShieldCheck,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    items: [
      { id: 'stop', label: 'Capital Guard', category: 'risk', desc: 'Hard limit risk mitigation' },
      { id: 'trail', label: 'Dynamic Trail', category: 'risk', desc: 'Profit preservation vector' },
      { id: 'hedge', label: 'System Hedge', category: 'risk', desc: 'Counter-party stasis' },
    ]
  }
];

export default function NodeLibrary() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('indicators');

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, category: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, label, category }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-full flex flex-col bg-black/60 backdrop-blur-3xl border-r border-white/5 relative overflow-hidden">
      {/* Background Architectural Glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-p/5 blur-[150px] -ml-[250px] -mt-[250px] pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
      
      {/* Header HUD - Industrial Command Center */}
      <div className="p-10 space-y-10 relative z-10 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                 <Cpu className="w-5 h-5 text-p" />
                 <h3 className="text-sm font-black text-white uppercase tracking-[0.6em] font-syne italic">Hardware_Inventory</h3>
              </div>
              <span className="text-[8px] text-white/20 font-black uppercase tracking-[0.4em]">Fabrication_Protocol_v4.2</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-p animate-ping opacity-40" />
              <div className="w-2 h-2 rounded-full bg-p animate-pulse shadow-[0_0_10px_#6366f1]" />
           </div>
        </div>

        <div className="space-y-6">
            <div className="relative group/search">
                <div className="absolute inset-0 bg-p/5 blur-xl group-focus-within/search:bg-p/10 transition-all opacity-0 group-focus-within/search:opacity-100" />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/search:text-p transition-colors relative z-10" />
                <input 
                    type="text"
                    placeholder="INITIALIZE_COMP_SEARCH..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-14 bg-black/40 border-2 border-white/5 rounded-2xl pl-14 pr-6 text-[11px] font-black uppercase tracking-[0.2em] text-white outline-none focus:border-p/30 transition-all placeholder:text-white/10 relative z-10 font-syne italic"
                />
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                {NODE_TYPES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                            "px-6 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap border-2 flex items-center gap-3 font-syne italic",
                            activeCategory === cat.id 
                                ? "bg-p text-white border-p shadow-[0_15px_30px_rgba(99,102,241,0.3)]" 
                                : "bg-white/[0.02] text-white/20 border-white/5 hover:text-white/40 hover:border-white/10"
                        )}
                    >
                        <cat.icon className={cn("w-4 h-4", activeCategory === cat.id ? "text-white" : "text-white/10")} />
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Components Matrix */}
      <div className="flex-1 overflow-y-auto p-10 space-y-12 no-scrollbar">
         {NODE_TYPES.filter(cat => activeCategory === cat.id).map((cat) => (
            <div key={cat.id} className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] font-syne italic whitespace-nowrap">Core_{cat.label.replace(' ', '_')}</span>
                    <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {cat.items.filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            draggable
                            onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, 'custom', item.label, item.category)}
                            className="group cursor-grab active:cursor-grabbing"
                        >
                            <Card className="p-8 bg-white/[0.01] border-2 border-white/5 hover:border-p/40 transition-all duration-700 rounded-[32px] relative overflow-hidden shadow-2xl group-hover:bg-white/[0.03]">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-p/5 blur-3xl rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute inset-0 bg-scanlines opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                                
                                <div className="flex gap-8 relative z-10">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[22px] flex items-center justify-center border-2 transition-all duration-1000",
                                        cat.bg,
                                        cat.border,
                                        "group-hover:rotate-[15deg] group-hover:scale-110 shadow-inner group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                    )}>
                                        <cat.icon className={cn("w-8 h-8", cat.color)} />
                                    </div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[16px] font-black text-white uppercase tracking-tighter italic font-syne group-hover:text-p transition-colors">{item.label}</h4>
                                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-p group-hover:border-p transition-all duration-500">
                                               <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] leading-relaxed line-clamp-2 italic font-syne">{item.desc}</p>
                                    </div>
                                </div>
                                
                                {/* Serial Status Terminal */}
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-p/50" />
                                        <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] font-mono">SOCKET_TX_OK</span>
                                     </div>
                                     <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em] font-mono italic">CRC_{Math.random().toString(16).slice(2, 6).toUpperCase()}</span>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
         ))}
      </div>

      {/* Fabrication HUD Status */}
      <div className="p-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
          <div className="p-8 rounded-[28px] bg-p/5 border-2 border-p/10 space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-[2px] bg-p/20 animate-scanline" />
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-p" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] font-syne italic">Neural_Assembler</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-1 h-1 rounded-full bg-p" />
                     <div className="w-1 h-1 rounded-full bg-p" />
                     <div className="w-1 h-1 rounded-full bg-white/10" />
                  </div>
               </div>
               <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.4em] leading-relaxed italic font-syne">
                 Synchronize module parameters onto the fabrication mesh to initialize high-frequency neural weighting.
               </p>
          </div>
      </div>
    </div>
  );
}
