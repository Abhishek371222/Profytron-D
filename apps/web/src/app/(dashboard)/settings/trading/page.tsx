'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
 Zap, 
 Activity, 
 Shield, 
 Cpu, 
 Network, 
 Database,
 RefreshCcw,
 Clock,
 ChevronRight,
 Target,
 BarChart3,
 Terminal,
 Server,
 AlertCircle,
 Plus
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

const Switch = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
 <div className="flex items-center justify-between p-8 rounded-4xl bg-white/2 border border-white/5 hover:border-white/10 transition-all group">
 <div className="space-y-1">
 <h4 className="text-sm font-semibold text-white uppercase tracking-widest group-hover:text-p transition-colors">{label}</h4>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.2em]">{desc}</p>
 </div>
 <button 
 onClick={() => onChange(!checked)}
 className={cn(
"w-16 h-8 rounded-full relative transition-all duration-500 p-1 border flex items-center overflow-hidden",
 checked
  ?"bg-p border-p/40 shadow-[0_0_20px_#6366f1] justify-end"
  :"bg-white/5 border-white/10 justify-start"
 )}
 >
 <motion.div 
 layout
 transition={{ type: 'spring', stiffness: 400, damping: 30 }}
 className={cn(
"w-6 h-6 rounded-full shadow-lg transition-colors",
 checked ?"bg-white" :"bg-white/20"
 )} 
 />
 </button>
 </div>
);

export default function ExecutionProtocolPage() {
 const [demoMode, setDemoMode] = React.useState(true);
 const [slippage, setSlippage] = React.useState([0.5]);
 const [latencyInducer, setLatencyInducer] = React.useState(false);
 const [autoScale, setAutoScale] = React.useState(false);
 const [isRefreshing, setIsRefreshing] = React.useState(false);
 const [heartbeatMs, setHeartbeatMs] = React.useState(500);
 const [nodes, setNodes] = React.useState([
  { name: 'KRAKEN_MAIN_GATEWAY', status: 'SYNCHRONIZED', latency: '28ms', type: 'Primary' },
  { name: 'BINANCE_NEURAL_LINK', status: 'STANDBY', latency: '42ms', type: 'Secondary' },
  { name: 'METATRADER_V5_INST', status: 'LEGACY_SYNC', latency: '112ms', type: 'External' },
 ]);
 const healthyNodes = nodes.filter((node) => node.status === 'SYNCHRONIZED').length;

 const handleDemoModeToggle = () => {
  setDemoMode((prev) => {
   const next = !prev;
   toast.message(next ? 'Simulation matrix enabled' : 'Simulation matrix disabled');
   return next;
  });
 };

 const handleLatencyInducerChange = (next: boolean) => {
  setLatencyInducer(next);
  toast.message(next ? 'Latency induction enabled' : 'Latency induction disabled');
 };

 const handleAutoScaleChange = (next: boolean) => {
  setAutoScale(next);
  toast.message(next ? 'Neural auto-scaling enabled' : 'Neural auto-scaling disabled');
 };

 const refreshNodes = () => {
 setIsRefreshing(true);
 setTimeout(() => {
  setIsRefreshing(false);
  toast.success('Execution nodes synchronized');
 }, 1200);
 };

 const handleAddNode = () => {
  const name = `CUSTOM_NODE_${String(nodes.length + 1).padStart(2, '0')}`;
  setNodes((prev) => [
   ...prev,
   { name, status: 'STANDBY', latency: '65ms', type: 'Custom' },
  ]);
  toast.success(`${name} linked`);
 };

 const handleConfigureNode = (nodeName: string) => {
  toast.message(`Opened configuration for ${nodeName}`);
 };

 const cycleHeartbeat = () => {
  const values = [250, 500, 1000, 2000];
  const idx = values.indexOf(heartbeatMs);
  const next = values[(idx + 1) % values.length];
  setHeartbeatMs(next);
  toast.message(`Heartbeat updated to ${next}ms`);
 };

 return (
 <div className="space-y-16 pb-20">
 {/* ── EXECUTION HUD ── */}
 <section className="space-y-10">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-5">
 <div className="w-14 h-14 rounded-[22px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-2xl">
 <Zap className="w-7 h-7 text-amber-400 animate-pulse" />
 </div>
 <div className="space-y-1">
 <h3 className="text-3xl font-semibold text-white uppercase tracking-tight">Execution Engine</h3>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.3em]">Neural deployment and capital exposure protocols</p>
 </div>
 </div>
 <button 
 onClick={refreshNodes}
 disabled={isRefreshing}
 className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:border-p/20 group transition-all"
 >
 <RefreshCcw className={cn("w-4 h-4 text-white/20 group-hover:text-p transition-all", isRefreshing &&"animate-spin")} />
 <span className="text-xs font-semibold text-white/20 uppercase tracking-widest group-hover:text-white">{isRefreshing ? 'Scanning Nodes...' : 'Active Node Re-Scan'}</span>
 </button>
 </div>

 <div className="flex flex-wrap items-center gap-3">
  <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300 uppercase tracking-widest">
   {healthyNodes}/{nodes.length} Nodes Synchronized
  </div>
  <div className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300 uppercase tracking-widest">
   Slippage Guard {slippage[0]}%
  </div>
 </div>

 {/* MODE TOGGLE */}
 <div className="relative group">
 <div className="absolute -inset-px bg-linear-to-br from-amber-500/20 to-transparent rounded-[36px] blur-xl opacity-30" />
 <div className="relative p-10 rounded-[40px] border border-amber-500/20 bg-amber-500/2 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
 <Database className="w-6 h-6 text-amber-500" />
 </div>
 <h4 className="text-xl font-semibold text-white uppercase tracking-tight">Simulation Matrix (Demo Mode)</h4>
 </div>
 <p className="text-xs text-white/30 font-semibold uppercase tracking-[0.2em] leading-relaxed max-w-lg">
 Engage virtualized liquidity pools for risk-free neural strategy validation. Live market data is used, but capital stays in escrow.
 </p>
 </div>
 <button 
 onClick={handleDemoModeToggle}
 className={cn(
"h-16 px-12 rounded-3xl font-semibold uppercase tracking-[0.4em] text-sm transition-all relative overflow-hidden",
 demoMode ?"bg-amber-500 text-black shadow-[0_0_40px_rgba(245,158,11,0.3)]" :"bg-white/5 text-white/20 border border-white/5"
 )}
 >
 {demoMode ? 'SIMULATION_ACTIVE' : 'ENGAGE SANDBOX'}
 </button>
 </div>
 </div>
 </section>

 {/* ── CORE PARAMETERS ── */}
 <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
 <div className="space-y-10">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
 <Target className="w-5 h-5 text-white/40" />
 </div>
 <h5 className="text-sm font-semibold text-white uppercase tracking-widest">Slippage Tolerance</h5>
 </div>
 
 <div className="p-10 rounded-[40px] bg-white/1 border border-white/5 space-y-8">
 <div className="flex justify-between items-end">
 <span className="text-xs font-semibold text-white/20 uppercase tracking-[0.3em]">Maximum Deviation</span>
 <span className="text-4xl font-semibold text-p">{slippage[0]}%</span>
 </div>
 <Slider 
 value={slippage} 
 onValueChange={setSlippage} 
 min={0.1}
 max={5} 
 step={0.1}
 className="[&_[role=slider]]:h-7 [&_[role=slider]]:w-7 [&_[role=slider]]:bg-white [&_[role=slider]]:border-p" 
 />
 <div className="flex justify-between text-xs font-semibold text-white/10 uppercase tracking-widest">
 <span>Precision (0.1%)</span>
 <span>High Risk (5%)</span>
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <Switch 
 checked={latencyInducer} 
 onChange={handleLatencyInducerChange} 
 label="Latency Induction" 
 desc="Simulate institutional relay delays (40ms - 150ms)."
 />
 <Switch 
 checked={autoScale} 
 onChange={handleAutoScaleChange} 
 label="Neural Auto-Scaling" 
 desc="Automatically adjust lot size based on account DNA."
 />
 <button onClick={cycleHeartbeat} className="p-8 rounded-4xl bg-white/2 border border-white/5 flex items-center justify-between group w-full text-left">
 <div className="space-y-1">
 <h4 className="text-sm font-semibold text-white uppercase tracking-widest group-hover:text-p transition-colors">Heartbeat Protocol</h4>
 <p className="text-xs text-white/20 font-semibold uppercase tracking-[0.2em]">Health check frequency for active nodes</p>
 </div>
 <div className="flex items-center gap-5">
 <span className="text-xl font-semibold text-white font-jet-mono uppercase tracking-widest">{heartbeatMs}ms</span>
 <ChevronRight className="w-5 h-5 text-white/10" />
 </div>
 </button>
 </div>
 </section>

 {/* ── CONNECTED TERMINALS ── */}
 <section className="space-y-10">
 <div className="flex items-center gap-6">
 <div className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center">
 <Server className="w-7 h-7 text-white/40" />
 </div>
 <h4 className="text-2xl font-semibold text-white uppercase tracking-tight">Execution Nodes</h4>
 <div className="h-px flex-1 bg-white/5" />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {nodes.map((node, i) => (
 <motion.div
 key={i}
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.05 }}
 whileHover={{ y: -4 }}
 className="p-8 rounded-[36px] bg-white/1 border border-white/5 hover:border-white/15 transition-all group relative overflow-hidden"
 >
 {node.status === 'SYNCHRONIZED' && (
 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-[40px] -mr-12 -mt-12" />
 )}
 <div className="flex items-start justify-between relative z-10">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <Terminal className="w-4 h-4 text-p" />
 <h5 className="text-sm font-semibold text-white uppercase tracking-widest">{node.name}</h5>
 </div>
 <div className="flex items-center gap-6">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-white/10 uppercase tracking-widest">STATUS</span>
 <span className={cn("text-xs font-semibold uppercase tracking-widest", node.status === 'SYNCHRONIZED' ? 'text-emerald-400' : 'text-white/40')}>
 {node.status}
 </span>
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-white/10 uppercase tracking-widest">LATENCY</span>
 <span className="text-xs font-semibold text-white uppercase tracking-widest font-jet-mono">{node.latency}</span>
 </div>
 </div>
 </div>
 <Button onClick={() => handleConfigureNode(node.name)} variant="ghost" className="h-10 px-6 rounded-xl border border-white/10 text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white">CONFIGURE</Button>
 </div>
 </motion.div>
 ))}
 
 <button onClick={handleAddNode} className="p-12 rounded-[36px] border border-dashed border-white/10 hover:border-p/40 hover:bg-p/2 transition-all group flex flex-col items-center justify-center gap-4">
 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-p group-hover:text-white transition-all">
 <Plus className="w-6 h-6 text-white/20 group-hover:text-white" />
 </div>
 <span className="text-sm font-semibold text-white/20 uppercase tracking-[0.4em] group-hover:text-white transition-colors">Handshake New Node</span>
 </button>
 </div>
 </section>
 </div>
 );
}
