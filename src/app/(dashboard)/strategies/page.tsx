'use client';

import * as React from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { 
  Search, Grid, List, Check, ArrowRight, Zap, Shield, 
  Activity, BarChart3, Plus, Filter, CheckCircle2, 
  AlertCircle, Brain, Terminal, Cpu, Database, Fingerprint, Network, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockStrategies, mockUser } from '@/lib/mocks/data';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import confetti from 'canvas-confetti';

const CATEGORIES = ['ALL', 'TREND', 'RANGE', 'SCALPING', 'VOLATILITY', 'ARBITRAGE'];
const RISK_COLORS = {
  'Low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  'Very Low': 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  'Medium': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]',
  'High': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
  'Expert': 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
};

const CATEGORY_COLORS = {
  'TREND': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'RANGE': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'SCALPING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'VOLATILITY': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'ARBITRAGE': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export default function StrategiesPage() {
  const [activeTab, setActiveTab] = React.useState<'library' | 'my-strategies'>('library');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('win_rate');
  
  // Activation State
  const [isActivationOpen, setIsActivationOpen] = React.useState(false);
  const [selectedStrategy, setSelectedStrategy] = React.useState<any>(null);
  const [activationStep, setActivationStep] = React.useState(1);
  const [paperTrading, setPaperTrading] = React.useState(true);
  const [riskMultiplier, setRiskMultiplier] = React.useState([1]);
  const [isActivating, setIsActivating] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Filter Logic
  const filteredStrategies = React.useMemo(() => {
    let list = activeTab === 'library' 
      ? mockStrategies 
      : mockStrategies.filter(s => s.status === 'Active');
    
    if (selectedCategory !== 'ALL') {
      list = list.filter(s => s.category === selectedCategory);
    }
    
    if (verifiedOnly) {
      list = list.filter(s => s.verified);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.creator.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a: any, b: any) => {
      if (sortBy === 'win_rate') return b.winRate - a.winRate;
      if (sortBy === 'sharpe') return b.sharpe - a.sharpe;
      if (sortBy === 'subscribers') return b.subscribers - a.subscribers;
      if (sortBy === 'newest') return parseInt(b.id.split('_')[1]) - parseInt(a.id.split('_')[1]);
      return 0;
    });
  }, [activeTab, selectedCategory, verifiedOnly, searchQuery, sortBy]);

  const handleActivate = (strategy: any) => {
    setSelectedStrategy(strategy);
    setActivationStep(1);
    setIsActivationOpen(true);
  };

  const processActivation = async () => {
    setIsActivating(true);
    // Simulate complex deployment sequence
    await new Promise(r => setTimeout(r, 800));
    setActivationStep(3.5); // Neural handshake phase
    await new Promise(r => setTimeout(r, 1200));
    setActivationStep(3.8); // Finalizing logic
    await new Promise(r => setTimeout(r, 1000));
    setIsActivating(false);
    setActivationStep(4);
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#06b6d4', '#8b5cf6', '#ffffff'],
      disableForReducedMotion: true
    });
  };

  return (
    <div className={cn("flex-1 space-y-10 p-8 max-w-[1800px] mx-auto relative", !mounted && "animate-pulse")}>
      {/* Background Ambient Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {!mounted ? (
        <>
          <div className="h-24 bg-white/[0.02] border border-white/5 rounded-3xl" />
          <div className="grid grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-white/[0.02] border border-white/5 rounded-3xl" />)}
          </div>
        </>
      ) : (
        <>
          {/* Hardware Header Row */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-p animate-pulse shadow-[0_0_15px_#6366f1]" />
                <span className="text-[11px] font-black text-p uppercase tracking-[0.5em] leading-none font-jet-mono">Strategic Ops Terminal</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter font-syne leading-none drop-shadow-2xl">
                Command Center
              </h1>
              <p className="text-xs text-white/40 font-bold uppercase tracking-[0.2em] font-jet-mono max-w-xl">
                Discover, configure, and seamlessly deploy high-frequency quantitative models.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Hardware Tabs */}
              <div className="flex items-center p-1.5 bg-black/50 backdrop-blur-3xl rounded-[20px] border border-white/10 shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)]">
                {['library', 'my-strategies'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "relative px-8 py-3.5 rounded-[16px] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                      activeTab === tab 
                        ? "text-white" 
                        : "text-white/30 hover:text-white/70"
                    )}
                  >
                    <span className="relative z-10">{tab === 'library' ? 'Intelligence Library' : 'My Active Nodes'}</span>
                    {activeTab === tab && (
                      <motion.div
                        layoutId="strategyTabGlow"
                        className="absolute inset-0 bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-[16px]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.7 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              <Button className="h-[52px] px-8 rounded-[20px] bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.1)] group transition-all duration-500">
                <Plus className="mr-3 h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                <span className="font-black tracking-[0.1em] uppercase text-[11px]">New Origin Node</span>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Advanced Filtering HUD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 flex flex-col gap-4 p-4 lg:p-6 bg-[#030303]/80 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)]"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Category Scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto invisible-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0",
                  selectedCategory === cat
                    ? "bg-p/20 border-p/50 text-white shadow-[0_0_20px_#6366f140]"
                    : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05] hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full lg:w-[320px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-p transition-colors" />
              <input
                type="text"
                placeholder="Scan strategies or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-black/50 border border-white/10 rounded-[16px] pl-12 pr-4 text-xs font-jet-mono text-white placeholder:text-white/20 outline-none focus:border-p/50 focus:shadow-[0_0_20px_#6366f120] transition-all"
              />
            </div>

            <div className="hidden md:flex items-center gap-4 px-4 h-12 bg-black/50 border border-white/10 rounded-[16px]">
              <div className="flex items-center gap-3">
                <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} className="data-[state=checked]:bg-green-500" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  Verified Net
                </span>
              </div>
              <div className="w-[1px] h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Sort:</span>
                <Select defaultValue={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-8 bg-transparent border-none text-[11px] font-jet-mono focus:ring-0 focus:ring-offset-0 p-0 text-white">
                    <SelectValue placeholder="Sort..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 text-white font-jet-mono">
                    <SelectItem value="win_rate">Win Rate %</SelectItem>
                    <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
                    <SelectItem value="subscribers">Network Size</SelectItem>
                    <SelectItem value="newest">Origin Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-black/50 border border-white/10 rounded-[12px]">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-[8px] transition-all", viewMode === 'grid' ? "bg-white/10 text-white shadow-inner" : "text-white/30 hover:text-white/60")}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-[8px] transition-all", viewMode === 'list' ? "bg-white/10 text-white shadow-inner" : "text-white/30 hover:text-white/60")}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Hardware Status Line */}
        <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-2 text-[9px] text-white/30 font-jet-mono uppercase tracking-[0.2em]">
                <Activity className="w-3 h-3 text-p" />
                <span>Found {filteredStrategies.length} Deployable Nodes</span>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </motion.div>

      {/* Strategy Grid Core */}
      <div className={cn(
        "grid gap-8",
        viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1"
      )}>
        <AnimatePresence mode="popLayout">
          {filteredStrategies.map((strategy, index) => (
            <CinematicStrategyCard 
              key={strategy.id} 
              strategy={strategy} 
              index={index} 
              viewMode={viewMode}
              onActivate={() => handleActivate(strategy)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredStrategies.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-32 flex flex-col items-center text-center space-y-6 relative"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.05),transparent_50%)] pointer-events-none" />
          <div className="relative">
            <Database className="h-24 w-24 text-white/5" />
            <Search className="absolute -bottom-2 -right-2 h-10 w-10 text-p/50 animate-pulse" />
          </div>
          <div className="space-y-2 relative z-10">
            <h3 className="text-3xl font-black font-syne text-white uppercase tracking-tighter">Void Echo</h3>
            <p className="text-white/40 max-w-md font-jet-mono text-xs uppercase tracking-widest leading-relaxed">
              No quantitative models found matching your current telemetry filters. Redefine your search parameters.
            </p>
          </div>
          <Button 
            variant="ghost" 
            className="text-p hover:text-white border border-p/20 hover:border-white/20 h-12 px-8 rounded-full font-jet-mono text-xs uppercase tracking-widest relative z-10 bg-black/50 backdrop-blur-md"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setVerifiedOnly(false);
            }}
          >
            Reset Telemetry Filters
          </Button>
        </motion.div>
      )}

      {/* Dark Luxury Neural Deployment Modal */}
      <Dialog open={isActivationOpen} onOpenChange={setIsActivationOpen}>
        <DialogContent className="max-w-2xl bg-[#050505] border-white/10 p-0 overflow-hidden rounded-[30px] shadow-[0_0_100px_rgba(0,0,0,1)]">
            
            {/* Modal Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-p/10 via-transparent to-cyan-500/10 pointer-events-none" />
            
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" />

          <div className="relative z-10 p-8">
            <AnimatePresence mode="wait">
              {activationStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-p font-jet-mono text-[10px] uppercase tracking-[0.3em] font-black">
                        <Terminal className="w-4 h-4" />
                        <span>Node Deployment Sequence Initiated</span>
                    </div>
                    <h2 className="text-3xl font-black font-syne text-white uppercase tracking-tighter">Review Telemetry</h2>
                  </div>

                  <div className="p-6 rounded-[24px] bg-black/60 border border-white/5 space-y-6 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-p/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-[16px] bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner">
                          <Cpu className="h-8 w-8 text-white/60" />
                        </div>
                        <div>
                          <h4 className="font-black font-syne text-white text-2xl tracking-tight uppercase">{selectedStrategy?.name}</h4>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 uppercase tracking-widest">
                              {selectedStrategy?.category}
                            </span>
                            {selectedStrategy?.verified && (
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="h-3 w-3" />
                                Verified Node
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 relative z-10">
                      <div className="space-y-2">
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Alpha Returns</p>
                        <p className="text-2xl font-black font-syne text-emerald-400">+{selectedStrategy?.returns}%</p>
                      </div>
                      <div className="space-y-2 border-l border-white/5 pl-4">
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Max Drawdown</p>
                        <p className="text-2xl font-black font-syne text-rose-400">-{selectedStrategy?.drawdown}%</p>
                      </div>
                      <div className="space-y-2 border-l border-white/5 pl-4">
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Sharpe Ratio</p>
                        <p className="text-2xl font-black font-syne text-cyan-400">{selectedStrategy?.sharpe}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setIsActivationOpen(false)} className="h-14 flex-1 rounded-[16px] border border-white/10 font-jet-mono text-xs uppercase tracking-widest hover:bg-white/5">Abort</Button>
                    <Button onClick={() => setActivationStep(2)} className="h-14 flex-[2] bg-white text-black hover:bg-white/90 rounded-[16px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.1)]">Authenticate Logic &rarr;</Button>
                  </div>
                </motion.div>
              )}

              {activationStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-amber-400 font-jet-mono text-[10px] uppercase tracking-[0.3em] font-black">
                        <Shield className="w-4 h-4" />
                        <span>Security & Risk Parameters</span>
                    </div>
                    <h2 className="text-3xl font-black font-syne text-white uppercase tracking-tighter">Configure Node Logic</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="p-5 rounded-[20px] bg-black/60 border border-white/10 backdrop-blur-md space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", paperTrading ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400")}>
                              {paperTrading ? <Database className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-widest">{paperTrading ? 'Simulation Matrix' : 'Live Global Capital'}</p>
                            <p className="text-[10px] font-jet-mono text-white/40 mt-1 uppercase tracking-wider">
                                {paperTrading ? 'Virtual liquidity engine engaged' : 'Warning: Real capital exposure'}
                            </p>
                          </div>
                        </div>
                        <Switch checked={paperTrading} onCheckedChange={setPaperTrading} className="scale-125 data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-rose-500" />
                      </div>
                    </div>

                    <div className="p-6 rounded-[20px] bg-black/60 border border-white/10 backdrop-blur-md space-y-8">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Risk Exposure Multiplier</label>
                            <p className="text-xs text-white/20 font-jet-mono">Base lot size variation</p>
                        </div>
                        <span className="text-3xl font-black font-syne text-white">{riskMultiplier[0]}x</span>
                      </div>
                      <Slider 
                        min={0.5} 
                        max={3} 
                        step={0.1} 
                        value={riskMultiplier} 
                        onValueChange={setRiskMultiplier}
                        className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-p"
                      />
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl font-jet-mono text-[10px] text-white/40 uppercase text-center tracking-widest">
                        Neural Output: {(riskMultiplier[0] * 0.12).toFixed(2)} lots / execution
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button variant="ghost" onClick={() => setActivationStep(1)} className="h-14 flex-1 rounded-[16px] border border-white/10 font-jet-mono text-xs uppercase tracking-widest hover:bg-white/5">Back</Button>
                    <Button onClick={() => setActivationStep(3)} className="h-14 flex-[2] bg-p hover:bg-p-hover text-white rounded-[16px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(99,102,241,0.2)]">Sign Logic Contract</Button>
                  </div>
                </motion.div>
              )}

              {activationStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-rose-400 font-jet-mono text-[10px] uppercase tracking-[0.3em] font-black animate-pulse">
                        <Fingerprint className="w-4 h-4" />
                        <span>Awaiting Biometric Confirmation</span>
                    </div>
                    <h2 className="text-3xl font-black font-syne text-white uppercase tracking-tighter">Finalize Deployment</h2>
                  </div>

                  <div className="p-8 rounded-[24px] bg-black/80 border border-white/10 relative overflow-hidden backdrop-blur-3xl">
                    {/* Cryptographic background logic */}
                    <div className="absolute inset-0 opacity-[0.02] font-jet-mono text-[8px] leading-tight break-all overflow-hidden flex flex-wrap content-start select-none">
                        {Array.from({length: 80}).map((_, i) => `${Math.random().toString(36).substr(2, 8).toUpperCase()} `)}
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                            <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse flex items-center justify-center">
                                <Network className="text-white/50 w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-white/50 font-jet-mono uppercase tracking-widest">Routing to</p>
                                <p className="font-syne font-black text-xl text-white">{mockUser.connectedAccounts[0]}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Model Identity</span>
                                <span className="text-xs font-jet-mono text-white">{selectedStrategy?.name} // {selectedStrategy?.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Execution Matrix</span>
                                <span className={cn("text-xs font-jet-mono font-black", paperTrading ? "text-amber-400" : "text-rose-400")}>
                                    {paperTrading ? "SIMULATED_CAP" : "LIVE_MARKET"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Risk Tensor</span>
                                <span className="text-xs font-jet-mono text-white">{riskMultiplier[0]}x Base</span>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      disabled={isActivating}
                      onClick={() => setActivationStep(2)} 
                      className="h-16 flex-[1] bg-transparent border border-white/10 hover:bg-white/5 rounded-[16px] font-jet-mono text-xs uppercase tracking-widest"
                    >
                      Refine
                    </Button>
                    <Button 
                      disabled={isActivating}
                      onClick={processActivation} 
                      className="h-16 flex-[2] relative overflow-hidden bg-white text-black hover:bg-white/90 rounded-[16px] font-black text-sm uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.2)] group"
                    >
                      {isActivating ? (
                          <div className="flex items-center gap-3">
                              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                              <span>Deploying...</span>
                          </div>
                      ) : (
                          <>
                            <span className="relative z-10 group-hover:tracking-[0.3em] transition-all duration-300">Authorize Deployment</span>
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent)] -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                          </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {activationStep > 3 && activationStep < 4 && (
                   <motion.div
                   key="step3.5"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="py-20 flex flex-col items-center justify-center space-y-8"
                 >
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-2 border-p border-t-transparent animate-spin" />
                        <div className="w-20 h-20 rounded-full border-2 border-cyan-500 border-b-transparent animate-[spin_1.5s_linear_infinite_reverse] absolute top-2 left-2" />
                        <Fingerprint className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter animate-pulse">
                            {activationStep === 3.5 ? 'Negotiating Neural Handshake' : 'Finalizing Cryptographic Logic'}
                        </h3>
                        <p className="text-[10px] font-jet-mono text-white/30 uppercase tracking-[0.3em]">Connecting to global liquidity pools...</p>
                    </div>
                 </motion.div>
              )}

              {activationStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 flex flex-col items-center text-center space-y-8 relative"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_60%)] pointer-events-none" />
                  
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
                    <div className="h-24 w-24 rounded-full bg-[#0a0a0a] border border-green-500/50 flex items-center justify-center relative z-10 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]">
                      <Check className="h-10 w-10 text-green-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <h3 className="text-4xl lg:text-5xl font-black font-syne text-white uppercase tracking-tighter drop-shadow-xl">Node Deployed</h3>
                    <p className="text-white/50 max-w-sm mx-auto font-jet-mono text-xs uppercase tracking-widest leading-relaxed">
                      Algorithms <span className="text-white font-bold">{selectedStrategy?.name}</span> successfully instantiated. Currently monitoring market topography.
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsActivationOpen(false)}
                    className="w-full max-w-sm h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] rounded-[16px] text-xs backdrop-blur-md transition-all duration-500 relative z-10"
                  >
                    View active nodes in dashboard
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -----------------------------------------------------------------
// Cinematic Strategy Card Component
// -----------------------------------------------------------------
function CinematicStrategyCard({ strategy, index, viewMode, onActivate }: any) {
  const [isHovered, setIsHovered] = React.useState(false);
  const chartReset = React.useRef(0);

  // 3D Perspective Setup properties
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    chartReset.current += 1;
  };

  // Dampen the motion slightly for a heavier, premium feel
  const springConfig = { damping: 20, stiffness: 100, mass: 1.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-150, 150], [8, -8]);
  const rotateY = useTransform(smoothX, [-150, 150], [-8, 8]);
  
  // Calculate relative glow position
  const glowX = useTransform(smoothX, [-150, 150], [0, 100]);
  const glowY = useTransform(smoothY, [-150, 150], [0, 100]);
  const background = useMotionTemplate`radial-gradient(circle 200px at ${glowX}% ${glowY}%, rgba(255,255,255,0.06), transparent 80%)`;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group relative flex flex-col lg:flex-row items-center justify-between p-5 rounded-[24px] bg-[#050505] border border-white/5 hover:border-white/20 transition-all cursor-default shadow-lg hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.01),transparent)] -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center gap-6 md:gap-8 flex-1 w-full relative z-10">
          <div className="w-[200px] shrink-0">
            <h4 className="font-black text-white text-lg font-syne uppercase tracking-tight truncate">{strategy.name}</h4>
            <div className="flex items-center gap-2 mt-2">
               <span className={cn("text-[8px] font-black px-2 py-1 rounded-sm border uppercase tracking-widest", CATEGORY_COLORS[strategy.category as keyof typeof CATEGORY_COLORS])}>{strategy.category}</span>
               {strategy.verified && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]" />}
            </div>
          </div>
          
          <div className="w-full lg:w-[200px] h-16 shrink-0 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] z-10 pointer-events-none" />
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={strategy.sparkline.map((v: any, i: any) => ({ v, i }))}>
                <defs>
                  <linearGradient id={`grad_list_v2_${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strategy.drawdown > 15 ? "#f43f5e" : "#10b981"} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={strategy.drawdown > 15 ? "#f43f5e" : "#10b981"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke={strategy.drawdown > 15 ? "#f43f5e" : "#10b981"} 
                  fillOpacity={1} 
                  fill={`url(#grad_list_v2_${strategy.id})`} 
                  strokeWidth={2}
                  isAnimationActive={false}
                />
               </AreaChart>
             </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 w-full border-t border-white/5 lg:border-t-0 pt-4 lg:pt-0">
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Returns</span>
               <span className="text-sm font-black font-jet-mono text-emerald-400">+{strategy.winRate}%</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Sharpe</span>
               <span className="text-sm font-black font-jet-mono text-cyan-400">{strategy.sharpe}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Network Nodes</span>
               <span className="text-sm font-black font-jet-mono text-white">{strategy.subscribers.toLocaleString()}</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Access Protocol</span>
               <span className="text-sm font-black font-jet-mono text-white">{strategy.price > 0 ? `$${strategy.price}/mo` : 'OPEN'}</span>
             </div>
          </div>
        </div>

        <Button 
          onClick={onActivate}
          className="mt-6 lg:mt-0 lg:ml-8 w-full lg:w-auto bg-white/5 text-white hover:bg-white hover:text-black border border-white/10 rounded-[16px] px-8 h-12 group uppercase text-[10px] font-black tracking-[0.2em] transition-all duration-500 relative z-10"
        >
          Initialize
          <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </motion.div>
    );
  }

  // Grid / Cinematic Mode
  return (
    <motion.div
      layout
      style={{ perspective: 1500 }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="relative w-full aspect-[4/5] sm:aspect-auto sm:h-[480px]"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn(
          "relative w-full h-full flex flex-col p-6 rounded-[30px] bg-[#050505] border transition-colors duration-500 overflow-hidden cursor-pointer",
          isHovered ? "border-white/20 shadow-2xl" : "border-white/5 shadow-lg"
        )}
      >
        {/* Dynamic Inner Glow */}
        <motion.div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500" style={{ background, opacity: isHovered ? 1 : 0 }} />
        
        {/* Subdued scanline texture */}
        <div className="absolute inset-0 bg-[url('/scanlines.png')] opacity-[0.02] mix-blend-overlay z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full transform-gpu" style={{ transform: "translateZ(40px)" }}>
            {/* Header: Identity & Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-[10px] bg-white/[0.03] border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${strategy.creator}`} alt="creator" className="w-6 h-6 opacity-80 mix-blend-luminosity" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black font-jet-mono uppercase tracking-[0.2em] text-white/30">Cmdr // {strategy.creator}</span>
                        {strategy.verified && <span className="text-[8px] text-emerald-400 uppercase tracking-widest font-black mt-0.5">Verified Identity</span>}
                    </div>
                </div>
                <div className={cn(
                    "px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest border",
                    CATEGORY_COLORS[strategy.category as keyof typeof CATEGORY_COLORS]
                )}>
                    {strategy.category}
                </div>
            </div>

            {/* Core Name */}
            <div className="mb-6 transform-gpu" style={{ transform: "translateZ(50px)" }}>
                <h3 className="text-2xl font-black font-syne text-white uppercase tracking-tighter leading-tight drop-shadow-md">
                    {strategy.name}
                </h3>
            </div>

            {/* Cinematic Telemetry Chart */}
            <div className="h-32 -mx-6 mb-8 relative border-y border-white/5 bg-white/[0.01]">
                <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_23px,rgba(255,255,255,0.03)_24px)] bg-[length:100%_24px] pointer-events-none" />
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={strategy.sparkline.map((v: any, i: any) => ({ v, i }))} key={chartReset.current}>
                    <defs>
                        <linearGradient id={`grad_cinematic_${strategy.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={strategy.drawdown > 15 ? "#f43f5e" : "#6366f1"} stopOpacity={0.3}/>
                            <stop offset="100%" stopColor={strategy.drawdown > 15 ? "#f43f5e" : "#6366f1"} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Area 
                        type="monotone" 
                        dataKey="v" 
                        stroke={strategy.drawdown > 15 ? "#f43f5e" : "#6366f1"} 
                        fillOpacity={1} 
                        fill={`url(#grad_cinematic_${strategy.id})`} 
                        strokeWidth={2}
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                    />
                </AreaChart>
                </ResponsiveContainer>
                {/* Edge Fades */}
                <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
            </div>

            {/* High-Density Data Matrix */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-auto transform-gpu" style={{ transform: "translateZ(20px)" }}>
                <div className="flex flex-col border-l-2 pl-3 border-emerald-500/20">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Alpha Yield</span>
                    <span className="text-lg font-black font-jet-mono text-emerald-400 -mt-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">+{strategy.returns}%</span>
                </div>
                <div className="flex flex-col border-l-2 pl-3 border-cyan-500/20">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Sharpe Ratio</span>
                    <span className="text-lg font-black font-jet-mono text-cyan-400 -mt-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">{strategy.sharpe}</span>
                </div>
                <div className="flex flex-col border-l-2 pl-3 border-rose-500/20">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Max Drawdown</span>
                    <span className="text-lg font-black font-jet-mono text-rose-400 -mt-1 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">-{strategy.drawdown}%</span>
                </div>
                <div className="flex flex-col border-l-2 pl-3 border-white/10">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Network Size</span>
                    <span className="text-lg font-black font-jet-mono text-white -mt-1">{strategy.subscribers.toLocaleString()}</span>
                </div>
            </div>

            {/* Execution Footer */}
            <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between transform-gpu" style={{ transform: "translateZ(30px)" }}>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Access Tier</span>
                    <span className="text-sm font-black font-jet-mono text-white">
                        {strategy.price > 0 ? `$${strategy.price}/mo` : <span className="text-white/60">OPEN_SOURCE</span>}
                    </span>
                </div>
                <Button 
                    onClick={(e) => { e.stopPropagation(); onActivate(); }}
                    className={cn(
                        "rounded-[14px] px-6 h-12 uppercase text-[10px] font-black tracking-[0.2em] transition-all duration-500 group relative overflow-hidden",
                        isHovered ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]" : "bg-white/5 text-white border border-white/10"
                    )}
                >
                    <span className="relative z-10 group-hover:mr-1 transition-all">Initialize</span>
                    <ArrowRight className="absolute right-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 w-4 h-4" />
                </Button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
