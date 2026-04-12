'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Activity, Shield, Zap, TrendingUp, 
  BarChart3, History, Info, Cpu, Globe, Lock,
  ChevronRight, Share2, Star, AlertTriangle, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { strategiesApi } from '@/lib/api/strategies';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { StrategyActivationModal } from '@/components/strategies/StrategyActivationModal';

export default function StrategyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'analytics' | 'trades' | 'details'>('analytics');
  const [isActivationOpen, setIsActivationOpen] = React.useState(false);

  const { data: strategy, isLoading } = useQuery({
    queryKey: ['strategy', id],
    queryFn: () => strategiesApi.getStrategy(id as string),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#030303]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-p border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-jet-mono text-white/20 uppercase tracking-[0.4em]">Synching Node Telemetry...</span>
        </div>
      </div>
    );
  }

  if (!strategy) return null;

  return (
    <div className="flex-1 min-h-screen bg-[#030303] text-white p-8 space-y-10 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-p/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Breadcrumbs & Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-semibold uppercase tracking-widest">Back to Terminal</span>
          </button>
          
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-3xl bg-white/3 border border-white/10 flex items-center justify-center shadow-inner relative group overflow-hidden">
               <div className="absolute inset-0 bg-linear-to-br from-p/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <Cpu className="w-10 h-10 text-white/40 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-bold tracking-tight uppercase">{strategy.name}</h1>
                {strategy.isVerified && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verified_Node</div>
                )}
              </div>
              <div className="flex items-center gap-3 text-white/30 text-xs font-jet-mono uppercase tracking-widest">
                <span>By {strategy.creator?.fullName}</span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <span className="text-p">{strategy.category}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" className="h-14 w-14 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button 
            onClick={() => setIsActivationOpen(true)}
            className="h-14 px-10 rounded-2xl bg-white text-black font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.1)] group transition-all hover:scale-[1.02]"
          >
            <span>Initialize Node</span>
            <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 relative z-10">
        
        {/* Left Column: Analytics & Stats */}
        <div className="xl:col-span-8 space-y-10">
          
          {/* Performance HUD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Total Alpha" value={`+${strategy.latestPerformance?.winRate || 0}%`} sub="Across All Periods" icon={<TrendingUp className="text-emerald-400" />} />
            <StatBox label="Sharpe Ratio" value={strategy.latestPerformance?.sharpeRatio || 0} sub="Risk Adjusted Return" icon={<Zap className="text-p" />} />
            <StatBox label="Max Drawdown" value={`-${strategy.latestPerformance?.maxDrawdown || 0}%`} sub="Historical Peak-to-Trough" icon={<AlertTriangle className="text-rose-400" />} />
            <StatBox label="Active Nodes" value={strategy.copiesCount || 0} sub="Network Replications" icon={<Globe className="text-cyan-400" />} />
          </div>

          {/* Core Charting Area */}
          <div className="p-8 rounded-4xl bg-black/40 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-p/50 to-transparent" />
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold uppercase tracking-tight">Equity Curve Telemetry</h3>
                <p className="text-xs text-white/20 font-jet-mono uppercase tracking-[0.2em]">P&L Performance over 365 Days</p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-white/3 border border-white/5 rounded-xl">
                {['1M', '3M', '1Y', 'ALL'].map(range => (
                  <button key={range} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", range === '1Y' ? "bg-p text-white" : "text-white/20 hover:text-white/40")}>{range}</button>
                ))}
              </div>
            </div>

            <div className="h-[450px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <AreaChart data={strategy.equityCurve || []}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short' })}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-10 border-b border-white/5">
              {[
                { id: 'analytics', label: 'History Metrics', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'trades', label: 'Execution Log', icon: <History className="w-4 h-4" /> },
                { id: 'details', label: 'Architecture', icon: <Info className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-3 pb-6 text-sm font-semibold uppercase tracking-widest transition-all relative",
                    activeTab === tab.id ? "text-white" : "text-white/20 hover:text-white/40"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div layoutId="tabUnderline" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-p shadow-[0_0_10px_#6366f1]" />
                  )}
                </button>
              ))}
            </div>

            <div className="min-h-[300px] p-8 rounded-4xl bg-black/20 border border-white/5">
               {activeTab === 'analytics' && <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-p uppercase tracking-[0.3em]">Monthly Pulse</h4>
                    <div className="space-y-4">
                       {Object.entries(strategy.monthlyReturns || {}).slice(0, 6).map(([month, val]) => (
                         <div key={month} className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5">
                            <span className="text-xs font-jet-mono text-white/40 uppercase">{month}</span>
                            <span className={cn("text-xs font-bold font-jet-mono", (val as number) > 0 ? "text-emerald-400" : "text-rose-400")}>
                               {(val as number) > 0 ? '+' : ''}{(val as number).toFixed(2)}%
                            </span>
                         </div>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-p uppercase tracking-[0.3em]">Stability Metrics</h4>
                    <div className="p-6 rounded-2xl bg-white/2 border border-white/5 space-y-8">
                       <MetricLine label="Avg. Monthly P&L" value="+4.82%" />
                       <MetricLine label="Profit Factor" value="2.14" />
                       <MetricLine label="Avg. Win Duration" value="1.4 days" />
                       <MetricLine label="Risk Reward Ratio" value="1:2.4" />
                    </div>
                  </div>
               </div>}
               {activeTab === 'trades' && <div className="flex flex-col items-center justify-center py-20 text-white/20 space-y-4">
                  <Terminal className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-jet-mono uppercase tracking-[0.4em]">Awaiting Execution Telemetry...</p>
               </div>}
               {activeTab === 'details' && <div className="space-y-8 animate-in fade-in duration-500">
                  <p className="text-sm text-white/60 leading-relaxed font-medium uppercase tracking-wide">
                    {strategy.description}
                  </p>
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                     <div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] block mb-4">Core Model Logic</span>
                        <div className="flex flex-wrap gap-2">
                           {['NEURAL_NET','L1_LIQUIDITY','SCALPING'].map(logic => (
                             <span key={logic} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold font-jet-mono text-white/40 uppercase tracking-widest">{logic}</span>
                           ))}
                        </div>
                     </div>
                     <div>
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] block mb-4">Security Protocol</span>
                        <div className="flex items-center gap-2 text-emerald-400">
                           <Lock className="w-4 h-4" />
                           <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">End-to-End Encrypted Strategy Gate</span>
                        </div>
                     </div>
                  </div>
               </div>}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Sidebar & Insights */}
        <div className="xl:col-span-4 space-y-10">
          
          {/* Creator Profile Card */}
          <div className="p-8 rounded-[40px] bg-linear-to-br from-white/5 to-transparent border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-p/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <h4 className="text-[10px] font-bold text-white/10 uppercase tracking-[0.6em] mb-8">Node_Creator_Identity</h4>
            <div className="flex items-center gap-6 mb-8">
              <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 p-1">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${strategy.creator?.fullName}`} alt="Avatar" className="w-full h-full rounded-full grayscale group-hover:grayscale-0 transition-all" />
              </div>
              <div>
                <h5 className="text-xl font-bold uppercase tracking-tight">{strategy.creator?.fullName}</h5>
                <p className="text-[10px] text-p uppercase tracking-[0.2em] font-bold">Verified Institution</p>
              </div>
            </div>
            <p className="text-xs text-white/30 leading-relaxed uppercase tracking-widest mb-8">
              {strategy.creator?.bio || 'Professional quantitative fund manager specializing in neural liquidity extraction.'}
            </p>
            <Button variant="ghost" className="w-full h-12 rounded-xl border border-white/5 bg-white/1 hover:bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em]">Contact Node Admin</Button>
          </div>

          {/* Operational Risk Insight */}
          <div className="p-8 rounded-[40px] bg-rose-500/2 border border-rose-500/10 space-y-6">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-[0.3em]">Risk Profile: {strategy.riskLevel}</h4>
            </div>
            <p className="text-xs text-rose-500/40 leading-relaxed uppercase tracking-widest font-medium">
              This node utilizes significant leverage during high-frequency cycles. Max historical drawdown was observed during the Q3 2024 flash crash. Ensure your Risk DNA is synchronized.
            </p>
          </div>

          {/* Hardware Connection Card */}
          <div className="p-1 px-8 py-8 rounded-[40px] border border-white/5 bg-black/60 relative overflow-hidden group">
             <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-white/2 border border-white/5 flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                   <Activity className="w-10 h-10 text-white/10 group-hover:text-primary transition-all duration-700" />
                   <div className="absolute inset-0 bg-primary/20 blur-2xl scale-0 group-hover:scale-100 transition-transform duration-700" />
                </div>
                <div className="space-y-2">
                   <h5 className="text-lg font-bold uppercase tracking-tight">Active Replication</h5>
                   <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold italic">Node Instance Sync Required</p>
                </div>
                <Button 
                  onClick={() => setIsActivationOpen(true)}
                  className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white hover:text-black hover:border-white transition-all duration-500 text-xs font-bold uppercase tracking-[0.3em]"
                >
                  Configure Handshake
                </Button>
             </div>
          </div>

        </div>
      </div>

      <StrategyActivationModal 
        isOpen={isActivationOpen} 
        onClose={() => setIsActivationOpen(false)} 
        strategy={strategy} 
      />
    </div>
  );
}

function StatBox({ label, value, sub, icon }: { label: string, value: any, sub: string, icon: React.ReactNode }) {
  return (
    <div className="p-6 rounded-3xl bg-white/2 border border-white/5 hover:border-p/20 transition-all group overflow-hidden relative">
      <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: 'w-20 h-20' })}
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-black/40 border border-white/5">{icon}</div>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</span>
        </div>
        <div className="space-y-1">
          <h4 className="text-3xl font-bold tracking-tight text-white">{value}</h4>
          <p className="text-[9px] font-jet-mono text-white/10 uppercase font-bold tracking-widest">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-white/3 last:border-0 last:pb-0">
      <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{label}</span>
      <span className="text-sm font-bold font-jet-mono text-white/80">{value}</span>
    </div>
  );
}
