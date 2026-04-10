'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  CheckCircle, 
  Globe, 
  Twitter, 
  Linkedin, 
  MessageSquare,
  Info,
  Shield,
  Zap,
  Activity,
  Cpu,
  Mail,
  User,
  Fingerprint,
  ChevronRight,
  Monitor,
  RotateCcw,
  Sparkles,
  Search,
  Box,
  Terminal,
  ShieldCheck,
  AlertCircle
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/Interactions';

const Switch = ({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
         <div className="space-y-1">
            <h4 className="text-[12px] font-black text-white uppercase tracking-widest italic group-hover:text-p transition-colors">{label}</h4>
            <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">{desc}</p>
         </div>
         <button 
            onClick={() => onChange(!checked)}
            className={cn(
                "w-16 h-8 rounded-full relative transition-all duration-500 p-1 border",
                checked ? "bg-p border-p/40 shadow-[0_0_20px_#6366f1]" : "bg-white/5 border-white/10"
            )}
         >
            <motion.div 
                animate={{ x: checked ? 32 : 0 }}
                className={cn(
                    "w-6 h-6 rounded-full shadow-lg transition-colors",
                    checked ? "bg-white" : "bg-white/20"
                )} 
            />
         </button>
    </div>
);

export default function ProfileSettingsPage() {
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [demoMode, setDemoMode] = React.useState(false);
  const [volatilitySync, setVolatilitySync] = React.useState(true);
  const [latencySim, setLatencySim] = React.useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
        setIsSaving(false);
        setIsDirty(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-16 pb-20">
      <div className="space-y-20">
        {/* AVATAR BIO-MODULE */}
        <div className="flex items-center gap-10">
          <div className="relative group">
            {/* Pulsing Back Glow */}
            <div className="absolute -inset-6 bg-p/20 rounded-full blur-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse font-syne" />
            
            <div className="w-40 h-40 rounded-full p-[3px] bg-gradient-to-tr from-p via-indigo-500 to-cyan-400 relative overflow-hidden group">
                <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/30 to-transparent h-[200%] pointer-events-none z-10" />
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all overflow-hidden relative shadow-[inset_0_0_30px_rgba(255,255,255,0.05)]">
                    <img 
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                        alt="Profile" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    {/* Biometric overlay */}
                    <div className="absolute inset-0 bg-p/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center backdrop-blur-sm">
                        <Fingerprint className="w-16 h-16 text-p shadow-[0_0_30px_#6366f1] animate-pulse" />
                    </div>
                </div>
            </div>
            
            <Magnetic strength={0.3}>
              <button className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-p border-2 border-white/20 flex items-center justify-center text-white shadow-[0_10px_30px_rgba(99,102,241,0.6)] hover:scale-110 active:scale-95 transition-all z-20">
                  <Upload className="w-6 h-6" />
              </button>
            </Magnetic>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter font-syne">Arjun Khanna</h3>
               <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-syne">Neural Verified</span>
               </div>
            </div>
            <p className="text-xs text-white/30 font-black uppercase tracking-[0.4em] font-syne">Node Cluster: PROFY_849204_KX_ALPHA</p>
            <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-p/10 border border-p/20 flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-p drop-shadow-[0_0_5px_#6366f1]" />
                   </div>
                   <div className="flex flex-col">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Protocol Tier</span>
                        <span className="text-sm font-black text-white italic tracking-widest uppercase">Apex Prime</span>
                   </div>
                </div>
                <div className="w-[1px] h-10 bg-white/5" />
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active session</span>
                    <span className="text-sm font-black text-p italic tracking-widest uppercase font-jet-mono">EPOCH 04.26_SYNC</span>
                </div>
            </div>
          </div>
        </div>

        {/* PLATFORM SIMULATION SECTION (THE DEMO THINGS) */}
        <section className="space-y-12">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-[22px] bg-p/10 border border-p/20 flex items-center justify-center shadow-2xl">
                   <Monitor className="w-7 h-7 text-p" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter font-syne">Platform Simulation Core</h4>
                    <p className="text-[10px] text-p/60 font-black uppercase tracking-[0.3em]">Configure sandbox execution environments and data mocks</p>
                </div>
                <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Switch 
                    checked={demoMode} 
                    onChange={setDemoMode} 
                    label="Active Demo State" 
                    desc="Initialize shadow execution for risk-free strategy validation." 
                />
                <Switch 
                    checked={volatilitySync} 
                    onChange={setVolatilitySync} 
                    label="Volatility Aggregator" 
                    desc="Inject synthetic market instability for stress testing." 
                />
                <Switch 
                    checked={latencySim} 
                    onChange={setLatencySim} 
                    label="Latency Inducer" 
                    desc="Simulate high-ping institutional relay delays (40ms - 120ms)." 
                />
                <div className="p-8 rounded-[32px] bg-p/[0.03] border border-p/10 flex items-center justify-between group hover:border-p/30 transition-all">
                     <div className="space-y-1">
                        <h4 className="text-[12px] font-black text-p uppercase tracking-widest italic">Simulation Power</h4>
                        <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">Scale of mock data injection frequency</p>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-white italic font-jet-mono">X1.5</span>
                        <Button variant="ghost" className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 p-0 hover:bg-p hover:text-white transition-all text-white/20">+</Button>
                     </div>
                </div>
            </div>

            <AnimatePresence>
                {demoMode && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-8 rounded-[36px] bg-amber-500/[0.03] border border-amber-500/20 flex items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] -mr-16 -mt-16 animate-pulse" />
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 flex-shrink-0 animate-bounce">
                                <AlertCircle className="w-8 h-8 text-amber-500" />
                            </div>
                            <div className="space-y-2">
                                <h5 className="text-lg font-black text-amber-500 uppercase tracking-tighter italic">DEMO PROTOCOL ENGAGED</h5>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-loose">All future strategy executions will be performed in a virtualized sandbox. Financial balances displayed are simulated for training purposes. High-fidelityMock Layer active.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>

        {/* IDENTITY FIELDS */}
        <section className="space-y-12">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                   <User className="w-7 h-7 text-white/40" />
                </div>
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter font-syne">Identity Registry</h4>
                <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-5 group">
                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-2 group-focus-within:text-p transition-colors font-syne">Persona Label</label>
                    <div className="relative">
                        <input 
                            defaultValue="Arjun Khanna"
                            onChange={() => setIsDirty(true)}
                            className="w-full h-18 bg-white/[0.03] border border-white/5 rounded-[28px] px-10 text-base font-black text-white italic outline-none focus:border-p/40 focus:bg-p/5 transition-all shadow-inner"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10" />
                    </div>
                </div>

                <div className="space-y-5 group text-syne">
                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-2 group-focus-within:text-p transition-colors font-syne">Quantum Handle</label>
                    <div className="relative">
                        <input 
                            defaultValue="@akhanna"
                            onChange={() => setIsDirty(true)}
                            className="w-full h-18 bg-white/[0.03] border border-emerald-500/20 rounded-[28px] px-10 text-base font-black text-white italic outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all tabular-nums shadow-inner"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest animate-pulse font-syne">Available</span>
                            <CheckCircle className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_#10b981]" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-5 group">
                <div className="flex items-center justify-between ml-2 font-syne">
                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] group-focus-within:text-p transition-colors">Neural Signature Metadata</label>
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-widest font-jet-mono">112 / 160 CHAR_SET</span>
                </div>
                <textarea 
                    rows={4}
                    defaultValue="Quant-focused trend follower with an appetite for high-frequency volatility. Currently scaling Neural EMA strategies in fragmented liquidity zones."
                    onChange={() => setIsDirty(true)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-[36px] p-10 text-sm font-black text-white/80 italic outline-none focus:border-p/40 focus:bg-p/5 transition-all resize-none leading-relaxed shadow-inner"
                />
            </div>
        </section>

        {/* INSTITUTIONAL BRANDING */}
        <section className="space-y-12">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-[22px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-2xl">
                   <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter font-syne">Institutional Branding</h4>
                    <p className="text-[9px] text-indigo-400/60 font-black uppercase tracking-[0.3em]">Customize your institutional identity across the Profytron network</p>
                </div>
                <div className="h-px flex-1 bg-white/5" />
            </div>

            {/* Firm Name & Handle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-5 group">
                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-2 group-focus-within:text-indigo-400 transition-colors font-syne">Firm / Institutional Name</label>
                    <input
                        defaultValue="Khanna Capital Partners"
                        className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-[22px] px-8 text-sm font-black text-white italic outline-none focus:border-indigo-400/40 focus:bg-indigo-500/5 transition-all"
                        onChange={() => setIsDirty(true)}
                    />
                </div>
                <div className="space-y-5 group">
                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-2 group-focus-within:text-indigo-400 transition-colors font-syne">Public Network Identifier</label>
                    <input
                        defaultValue="@kcp_alpha"
                        className="w-full h-14 bg-white/[0.03] border border-indigo-500/20 rounded-[22px] px-8 text-sm font-black text-white italic outline-none focus:border-indigo-400/40 focus:bg-indigo-500/5 transition-all"
                        onChange={() => setIsDirty(true)}
                    />
                </div>
            </div>

            {/* Theme Color Palette */}
            <div className="space-y-5">
                <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-2 font-syne">Brand Accent Color</label>
                <div className="flex items-center gap-4 flex-wrap">
                    {[
                        { name: 'Indigo Neural', color: '#6366f1' },
                        { name: 'Cyan Arc', color: '#06b6d4' },
                        { name: 'Emerald Alpha', color: '#10b981' },
                        { name: 'Violet Core', color: '#8b5cf6' },
                        { name: 'Amber Prime', color: '#f59e0b' },
                        { name: 'Rose Tension', color: '#f43f5e' },
                    ].map((c, i) => (
                        <button
                            key={c.name}
                            title={c.name}
                            onClick={() => setIsDirty(true)}
                            className={`w-12 h-12 rounded-2xl border-2 transition-all duration-300 hover:scale-110 group/swatch relative overflow-hidden ${i === 0 ? 'border-white/60 scale-110 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'border-transparent hover:border-white/30'}`}
                            style={{ background: c.color }}
                        >
                            {i === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tagline */}
            <div className="space-y-5 group">
                <div className="flex items-center justify-between ml-2">
                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] group-focus-within:text-indigo-400 transition-colors font-syne">Institutional Tagline</label>
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-widest font-jet-mono">80 CHAR MAX</span>
                </div>
                <input
                    defaultValue="Systematic Alpha. Institutional Precision."
                    className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-[22px] px-8 text-sm font-black text-white italic outline-none focus:border-indigo-400/40 focus:bg-indigo-500/5 transition-all"
                    onChange={() => setIsDirty(true)}
                />
            </div>

            {/* Social Links */}
            <div className="space-y-6">
                <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-2 font-syne">Network Profiles</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Globe, placeholder: 'https://yourfirm.com', label: 'Primary Domain' },
                        { icon: Twitter, placeholder: '@handle', label: 'X / Twitter' },
                        { icon: Linkedin, placeholder: 'LinkedIn URL', label: 'LinkedIn' },
                    ].map(({ icon: Icon, placeholder, label }) => (
                        <div key={label} className="space-y-3 group">
                            <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-2 group-focus-within:text-indigo-400 transition-colors">{label}</label>
                            <div className="relative">
                                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    placeholder={placeholder}
                                    onChange={() => setIsDirty(true)}
                                    className="w-full h-12 bg-white/[0.03] border border-white/5 rounded-[16px] pl-10 pr-4 text-xs font-black text-white/70 italic outline-none focus:border-indigo-400/40 focus:bg-indigo-500/5 transition-all placeholder:text-white/10"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Branding Preview Card */}
            <div className="p-6 rounded-[28px] bg-white/[0.01] border border-white/5 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Live Branding Preview</p>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        <span className="text-white font-black font-syne text-xl">K</span>
                    </div>
                    <div>
                        <h5 className="text-lg font-black text-white italic tracking-tighter font-syne uppercase">Khanna Capital Partners</h5>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] mt-0.5">Systematic Alpha. Institutional Precision.</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-jet-mono">@kcp_alpha</span>
                            <div className="w-[1px] h-3 bg-white/10" />
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-jet-mono">APEX_PRIME_TIER</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>


        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-6">
                <div className="w-4 h-4 rounded-full bg-p/20 animate-pulse relative">
                    <div className="absolute inset-0 bg-p rounded-full animate-ping opacity-20" />
                </div>
                <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] font-syne">Protocol active: Layer 2 Cryptic Sync Sequence Active</p>
            </div>
            <div className="flex items-center gap-12">
                <button 
                  className={cn(
                    "text-[12px] font-black text-white/20 uppercase tracking-[0.5em] hover:text-white transition-all font-syne",
                    !isDirty && "opacity-0 pointer-events-none"
                  )}
                  onClick={() => setIsDirty(false)}
                >
                  Discard
                </button>
                
                <Magnetic strength={0.2}>
                  <Button 
                      className={cn(
                          "h-20 px-16 rounded-[28px] font-black uppercase tracking-[0.6em] transition-all relative overflow-hidden group shadow-2xl font-syne italic",
                          isDirty 
                              ? "bg-p hover:bg-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.4)] text-white" 
                              : "bg-white/5 text-white/5 pointer-events-none border border-white/5"
                      )}
                      onClick={handleSave}
                  >
                      {isSaving ? (
                          <div className="flex items-center gap-6">
                               <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                               <span className="italic tracking-[0.8em]">SYNCING...</span>
                          </div>
                      ) : (
                          "Commit Core Protocol"
                      )}
                      
                      {/* Scanline for primary button */}
                      {isDirty && (
                        <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-white/20 to-transparent h-[200%] pointer-events-none" />
                      )}
                  </Button>
                </Magnetic>
            </div>
        </div>
      </div>

      {/* SIDEBAR SNAPSHOT HUD */}
      <div className="space-y-10">
         <div className="p-10 rounded-[44px] glass-ultra border border-white/5 bg-white/[0.01] space-y-12 relative overflow-hidden group shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 right-0 w-44 h-44 bg-p/20 rounded-full blur-[100px] -mr-22 -mt-22 group-hover:bg-p/30 transition-all duration-1000" />
            
            <div className="space-y-4 relative z-10">
               <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] font-syne">Reputation Index</span>
               <div className="flex items-end justify-between">
                  <span className="text-5xl font-black text-white italic tracking-tighter font-syne">9.82</span>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-syne">A+ RATING</span>
                    <span className="text-[8px] font-black text-white/10 uppercase tracking-widest font-jet-mono mt-1">HIGH_TRUST</span>
                  </div>
               </div>
               <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden mt-6 border border-white/5 p-0.5">
                  <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} className="h-full bg-gradient-to-r from-p to-cyan-400 rounded-full shadow-[0_0_15px_#6366f1]" />
               </div>
            </div>

            <div className="space-y-8 relative z-10 pt-4">
               {[
                  { label: '2FA Protocol', icon: Shield, color: 'text-p', active: true },
                  { label: 'Pulse Node', icon: Activity, color: 'text-indigo-400', active: true },
                  { label: 'Institutional KYC', icon: Box, color: 'text-cyan-400', active: true },
                  { label: 'Quantum Relay', icon: Cpu, color: 'text-amber-500', active: false, label2: 'PENDING' },
               ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between group/row">
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/row:scale-110 transition-transform">
                                <item.icon className={cn("w-5 h-5", item.active ? item.color : "text-white/10")} />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] font-syne group-hover/row:text-white transition-colors">{item.label}</span>
                        </div>
                        {item.active ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_5px_#10b981]" />
                        ) : (
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">{item.label2}</span>
                        )}
                   </div>
               ))}
            </div>

            <Button variant="ghost" className="w-full h-16 rounded-[24px] bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all group font-syne">
                Full Security Audit
                <ChevronRight className="w-4 h-4 ml-4 group-hover:translate-x-2 transition-transform" />
            </Button>
         </div>

         <div className="p-10 space-y-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-p/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3">
                 <Sparkles className="w-5 h-5 text-p animate-pulse" />
                 <h5 className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] font-syne">Neural Insights</h5>
            </div>
            <p className="text-[12px] text-white/40 leading-relaxed italic font-syne font-medium">
              "System performance is optimized for high-volatility sessions. We recommend rotating your Quantum Access keys every 90 epochs to maintain L3 trust levels."
            </p>
            <div className="pt-4 border-t border-white/5">
                <span className="text-[9px] font-black text-p/40 uppercase tracking-[0.4em] font-syne">ADVICE_GENERATED_BY_AI_CORE</span>
            </div>
         </div>
      </div>
    </div>
  );
}
