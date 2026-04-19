'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ArrowRight, 
  MessageSquare,
  Zap,
  ShieldCheck,
  History,
  Send,
  Target,
  Activity,
  Cpu,
  Box
} from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/Interactions';
import { aiApi, type CoachingReport } from '@/lib/api/ai';
import { toast } from 'sonner';

// Mock Insights
const INSIGHTS = [
  { 
    id: 1, 
    type: 'good', 
    icon: TrendingUp, 
    title: 'Discipline Protocol', 
    body: "Risk limits maintained for 14 consecutive daily cycles. Psychological stability verified.", 
    color: 'text-emerald-400', 
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]'
  },
  { 
    id: 2, 
    type: 'warning', 
    icon: AlertTriangle, 
    title: 'Behavioral Deviation', 
    body: "Strategy hopping detected. 4 switches post-drawdown. Re-evaluating edge persistence.", 
    tip: 'Observe 14-day quarantine for new strategies.',
    color: 'text-amber-400', 
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]'
  },
  { 
    id: 3, 
    type: 'danger', 
    icon: AlertCircle, 
    title: 'Capacity Overload', 
    body: "23 manual overrides detected. Emotional friction level: HIGH (CRITICAL).", 
    color: 'text-red-400', 
    glow: 'shadow-[0_0_20px_rgba(248,113,113,0.3)]'
  },
  { 
    id: 4, 
    type: 'info', 
    icon: Activity, 
    title: 'Alpha Window', 
    body: "Neural efficiency peaks (84%) during 10:00–12:00 IST liquid windows.", 
    color: 'text-indigo-400', 
    glow: 'shadow-[0_0_20px_rgba(129,140,248,0.3)]'
  },
];

const SUGGESTIONS = [
  "Analyze current volatility exposure",
  "Review my last drawdown cycle",
  "Optimize my stop-loss placement",
  "Check correlation with BTC/USD",
  "Recalibrate strategy NeuralPro v2",
];

const INITIAL_MESSAGES = [
  {
    id: '1',
    role: 'ai',
    text: "System Online. Greetings, Trader. Terminal integrity verified.\nPortfolio metrics: +$3,240 (Intraday). MomentumPro v4 showing high statistical resonance. Proceed with deep analysis?"
  }
];

export default function AICoachPage() {
  const router = useRouter();
  const [messages, setMessages] = React.useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [report, setReport] = React.useState<CoachingReport | null>(null);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  React.useEffect(() => {
    aiApi
      .getCoachingReport()
      .then(setReport)
      .catch(() => {
        setReport(null);
        toast.error('Coaching report unavailable', {
          description: 'Using baseline tactical feed until report sync recovers.',
        });
      });
  }, []);

  const handleSend = React.useCallback(async (text: string) => {
    if (!text.trim()) return;
    const newMessage = { id: `${Date.now()}`, role: 'user' as const, text };
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    setIsTyping(true);
    try {
      const response = await aiApi.chat(text);
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: response?.reply || 'No response from AI coach.',
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch {
      setIsTyping(false);
      const aiResponse = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: 'AI coach is temporarily unavailable. Please retry in a few seconds.'
      };
      setMessages(prev => [...prev, aiResponse]);
      toast.error('AI coach unavailable', {
        description: 'Unable to process this command right now. Please retry shortly.',
      });
      return;
    } finally {
      setIsTyping(false);
    }
  }, []);

  return (
    <div className="relative flex h-[calc(100vh-140px)] flex-col gap-5 overflow-hidden p-2 xl:flex-row">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      {/* LEFT PANEL: Insights Terminal */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex w-full shrink-0 flex-col gap-4 xl:w-[390px]"
      >
        <div className="glass-ultra relative flex-1 space-y-8 overflow-y-auto rounded-[34px] border border-white/10 bg-white/[0.015] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] no-scrollbar">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/10 to-transparent opacity-60 transition-opacity duration-1000" />
          
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]" />
              <span className="text-xs font-semibold text-white/30 uppercase tracking-[0.6em]">Neural Engine v4.2</span>
            </div>
            <h1 className="text-3xl font-semibold text-white uppercase tracking-tight leading-tight">Tactical Feed</h1>
            <p className="text-sm text-white/55">Behavioral telemetry and risk-state diagnostics for your active cycle.</p>
            <div className="h-px w-24 bg-primary/40" />
            {report ? (
              <p className="text-xs text-white/50 uppercase tracking-[0.2em]">
                Win Rate: {report.winRate}% | Avg PnL: {report.avgPnl}
              </p>
            ) : null}
          </div>

          <div className="space-y-6 relative z-10">
            {INSIGHTS.map((insight, idx) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-[26px] border p-5 transition-all duration-500",
                  "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                {/* Hardware Accent Corners */}
                <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 bg-linear-to-br from-white/5 to-transparent" />
                <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100" />
                
                <div className="flex gap-5">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-700",
                    "border-white/10 bg-white/5 outline-0 outline-white/15 group-hover:scale-110 group-hover:rotate-3 group-hover:outline-1",
                    insight.color
                  )}>
                    <insight.icon className="w-6 h-6 drop-shadow-[0_0_8px_currentColor]" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("text-[13px] font-semibold uppercase tracking-[0.2em] transition-colors", insight.color)}>
                        {insight.title}
                      </h4>
                      <span className="text-[10px] font-mono text-white/10 uppercase tracking-widest">ID_S.{insight.id}</span>
                    </div>
                    <p className="text-[13px] text-white/60 font-medium leading-relaxed font-sans group-hover:text-white/80 transition-colors">
                      {insight.body}
                    </p>
                    {insight.tip && (
                      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-3.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider leading-relaxed">
                          Core Suggestion: {insight.tip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Holographic Biometric ID */}
          <div className="relative mt-auto overflow-hidden rounded-[30px] border border-white/10 bg-black/45 p-6 shadow-2xl group">
            <div className="absolute inset-0 bg-scanlines opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/20 animate-scanline pointer-events-none" />
            
            <div className="relative z-10 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Box className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary uppercase tracking-[0.4em]">Biometric ID</span>
              </div>
              <span className="text-[10px] font-semibold text-white/20 font-mono tracking-widest">TRADER_VAL_8820</span>
            </div>

            <div className="relative z-10 flex items-center gap-6">
              <div className="relative w-24 h-24 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                  <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
                  <motion.circle 
                    cx="48" cy="48" r="42" 
                    stroke="#6366f1" strokeWidth="6" 
                    strokeDasharray="263.8"
                    initial={{ strokeDashoffset: 263.8 }}
                    animate={{ strokeDashoffset: 263.8 * (1 - 0.78) }} 
                    transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                    fill="transparent" 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                  <span className="text-3xl font-semibold text-white tracking-tighter">78</span>
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] -mt-1">INDEX</span>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-white uppercase tracking-widest">Neural Stability</span>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    Safe Zone reached
                  </p>
                </div>
                
                <div className="flex gap-1.5 pt-2">
                  {[0.4, 0.7, 1, 0.6, 0.8, 0.3, 0.9].map((s, i) => (
                    <div key={i} className={cn(
                      "w-1.5 h-5 bg-white/5 rounded-full relative overflow-hidden",
                      i > 4 ? "hidden xl:block" : ""
                    )}>
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${s * 100}%` }}
                        transition={{ delay: 1.5 + i * 0.1, duration: 1, ease: "circOut" }}
                        className="absolute bottom-0 left-0 w-full bg-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[9px] font-mono tracking-widest text-white/20 uppercase">
              <span>Latency_Sync: Optimized</span>
              <span>Enc: AES-256V4</span>
            </div>
          </div>
        </div>

        {/* System Status HUD */}
        <div className="glass-ultra relative flex h-20 items-center justify-between overflow-hidden rounded-[24px] border border-white/10 px-6 group">
          <div className="absolute inset-0 bg-linear-to-r from-emerald-500/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
              <Cpu className="w-5 h-5 text-white/30" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.4em]">Latency_Matrix</span>
              <span className="text-sm font-semibold text-emerald-400 font-mono tracking-tight transition-all group-hover:translate-x-1">14ms QUANTUM</span>
            </div>
          </div>
          <div className="flex items-center gap-4 relative z-10 text-right">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.4em]">Neural_Load</span>
              <span className="text-sm font-semibold text-indigo-400 font-mono tracking-tight transition-all group-hover:-translate-x-1">4.2% IDLE_CORE</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
              <Activity className="w-5 h-5 text-indigo-400/50" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL: Holographic Communicator */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass-ultra relative z-10 flex flex-1 flex-col overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.01] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 right-0 w-150 h-150 bg-primary/5 blur-[150px] rounded-full pointer-events-none -mr-60 -mt-60 z-0" />
        
        {/* Chat Header */}
        <div className="relative z-10 flex h-24 items-center justify-between border-b border-white/10 bg-black/25 px-6 backdrop-blur-3xl xl:px-10">
          <div className="flex items-center gap-8">
            <div className="relative group/avatar">
              <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
              <div className="w-16 h-16 rounded-[22px] bg-linear-to-tr from-primary via-indigo-400 to-cyan-400 p-[1.5px] relative z-10">
                <div className="w-full h-full rounded-[21px] bg-bg-base flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-scanlines opacity-10 animate-scanline" />
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-black z-20 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl xl:text-2xl font-semibold text-white uppercase tracking-tight">Intelligence Core</h2>
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Quant_Sync v8.2 Tactical</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 xl:gap-6">
            <div className="hidden text-right xl:flex xl:flex-col">
              <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.4em]">Active Engine</span>
              <span className="text-sm font-semibold text-white/50 font-jet-mono uppercase tracking-widest">Claude_3.5_Quantum</span>
            </div>
            <div className="w-px h-12 bg-white/5" />
            <Button onClick={() => router.push('/history')} variant="ghost" size="icon" className="w-14 h-14 rounded-2xl bg-white/3 border border-white/10 hover:border-primary/40 hover:bg-primary/5 text-white/20 hover:text-primary transition-all duration-500 group">
              <History className="w-6 h-6 group-hover:rotate-[-10deg] transition-transform" />
            </Button>
          </div>
        </div>

        {/* Message Area */}
        <div className="relative z-10 flex-1 space-y-12 overflow-y-auto px-6 py-8 xl:px-10 xl:py-10 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 30, scale: 0.98, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  "group relative flex max-w-[92%] items-start gap-5 xl:max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                {msg.role === 'ai' && (
                  <div className="w-12 h-12 rounded-2xl glass-ultra border-primary/20 flex items-center justify-center shrink-0 shadow-2xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                    <Sparkles className="w-6 h-6 text-primary relative z-10" />
                  </div>
                )}
                
                <div className={cn(
                  "relative",
                  msg.role === 'user' ? "text-right" : ""
                )}>
                  {msg.role === 'ai' && <div className="absolute -inset-4 bg-primary/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />}
                  
                  <div className={cn(
                    "relative rounded-[28px] p-5 text-[14px] xl:text-[15px] font-medium leading-[1.7] shadow-2xl transition-all duration-700",
                    msg.role === 'ai' 
                      ? "rounded-tl-none border border-white/10 bg-white/[0.03] text-white/85 hover:border-white/20 hover:bg-white/[0.05]" 
                      : "rounded-tr-none border border-primary/40 bg-linear-to-br from-primary to-indigo-600 text-white hover:shadow-primary/20"
                  )}>
                    {msg.text.split('\n').map((line, i) => {
                      const parts = line.split(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/g);
                      return (
                        <p key={i} className={cn(i > 0 ? "mt-6" : "")}>
                          {parts.map((part, j) => {
                            if (part.match(/(\$\d+(?:,\d+)*(?:\.\d+)?|\d+(?:\.\d+)?%?)/)) {
                              return (
                                <span key={j} className={cn(
                                  "font-jet-mono font-bold tracking-tight mx-0.5 px-1.5 py-0.5 rounded-lg",
                                  msg.role === 'ai' ? "text-primary bg-primary/5" : "text-white bg-black/20"
                                )}>
                                  {part}
                                </span>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                    
                    {msg.role === 'ai' && (
                      <div className="absolute top-4 right-6 flex gap-1.5 opacity-20">
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-75" />
                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-150" />
                      </div>
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-[10px] font-bold text-white/10 uppercase tracking-[0.5em] mt-4 block font-mono",
                    msg.role === 'user' ? "mr-4" : "ml-4"
                  )}>
                    {msg.role === 'ai' ? 'PROTOCOL_TRANSMISSION_SECURED' : 'MANUAL_OVERRIDE_VERIFIED'}
                  </span>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-5 ml-20"
              >
                <div className="flex gap-2 p-4 rounded-2xl bg-white/3 border border-white/10 shadow-inner">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.4, 1], 
                        opacity: [0.3, 1, 0.3],
                        backgroundColor: i === 1 ? ["#6366f1", "#818cf8", "#6366f1"] : "#6366f1"
                      }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.4em] animate-pulse">Neural_Synthesis_Active...</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Command Center */}
          <div className="relative z-20 border-t border-white/10 bg-black/25 p-6 backdrop-blur-3xl xl:p-8">
          {/* Quick Suggestions */}
          <div className="group/suggestions mb-6 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + (i * 0.1) }}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50 transition-all hover:-translate-y-1 hover:border-primary/60 hover:text-white hover:shadow-[0_10px_30px_rgba(99,102,241,0.12)] active:translate-y-0"
              >
                {s}
              </motion.button>
            ))}
          </div>

          <div className="relative group p-[2px] rounded-4xl overflow-hidden transition-all duration-700 focus-within:shadow-[0_0_50px_rgba(99,102,241,0.15)]">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary/50 to-transparent group-focus-within:translate-x-full transition-transform duration-1500 ease-in-out -translate-x-full" />
            
            <div className="relative z-10 flex h-20 items-center rounded-[24px] border border-white/10 bg-white/[0.03] px-5 transition-all duration-500 group-focus-within:border-primary/40 group-focus-within:bg-white/[0.06] xl:h-24 xl:px-8">
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                placeholder="EXECUTE COMMAND OR QUERY CORE..."
                className="flex-1 bg-transparent text-[13px] xl:text-[15px] font-semibold tracking-tight text-white uppercase outline-none placeholder:text-white/20"
              />
              <div className="flex items-center gap-4 xl:gap-8">
                <span className="text-[10px] font-bold text-white/5 font-mono tracking-[0.3em] hidden xl:block uppercase">
                  METADATA_LENGTH: {inputValue.length} {" // "} 500
                </span>
                <Magnetic strength={0.3}>
                  <button 
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim()}
                    className="w-14 h-14 rounded-3xl bg-primary hover:bg-indigo-500 disabled:opacity-20 disabled:hover:bg-primary flex items-center justify-center transition-all shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-90 group/btn"
                  >
                    <Send className="w-6 h-6 text-white group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-6 gap-8">
            <span className="text-[9px] font-bold text-white/5 uppercase tracking-[0.5em]">Neural_Link_Secured</span>
            <span className="text-[9px] font-bold text-white/5 uppercase tracking-[0.5em]">Protocol_v8.42_Alpha</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
